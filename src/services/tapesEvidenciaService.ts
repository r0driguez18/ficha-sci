import { supabase } from '@/integrations/supabase/client';
import type { TapesEvidenciaFile } from '@/types/taskboard';

/**
 * Prova do "display-tape" (folha de verificação de tapes).
 *
 * O ficheiro (PDF ou TXT) é guardado no bucket privado `tapes-evidencia`; a
 * lista de ficheiros anexados a cada ficha é gravada pela função
 * `set_tapes_evidencia` (SECURITY DEFINER), que também atualiza o
 * `tapes_status` da ficha.
 */

const BUCKET = 'tapes-evidencia';
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB por ficheiro

export type TapesUploadType = TapesEvidenciaFile['type'];

function classifyFile(file: File): TapesUploadType | null {
  const name = file.name.toLowerCase();
  if (file.type === 'application/pdf' || name.endsWith('.pdf')) return 'application/pdf';
  if (file.type === 'text/plain' || name.endsWith('.txt')) return 'text/plain';
  return null;
}

function slug(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // remove acentos
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .slice(0, 80);
}

/**
 * Carrega um ou mais ficheiros de evidência e junta-os aos já existentes.
 * Devolve a lista final gravada na ficha.
 */
export async function addTapesEvidencia(
  taskboardId: string,
  formType: string,
  date: string,
  existing: TapesEvidenciaFile[],
  files: File[],
): Promise<{ data: TapesEvidenciaFile[] | null; error: string | null }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: 'Utilizador não autenticado' };

  const uploaded: TapesEvidenciaFile[] = [];
  for (const file of files) {
    const type = classifyFile(file);
    if (!type) {
      return { data: null, error: `"${file.name}": só são aceites ficheiros PDF ou TXT.` };
    }
    if (file.size > MAX_BYTES) {
      return { data: null, error: `"${file.name}": excede o limite de 10 MB.` };
    }

    const path = `${formType}/${date}/${Date.now()}-${slug(file.name)}`;
    const { error: upErr } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, { contentType: type, upsert: true });
    if (upErr) {
      return { data: null, error: `Erro ao carregar "${file.name}": ${upErr.message}` };
    }

    uploaded.push({
      path,
      name: file.name,
      size: file.size,
      type,
      uploaded_at: new Date().toISOString(),
      uploaded_by: user.id,
    });
  }

  const nextList = [...existing, ...uploaded];
  const { error } = await supabase.rpc('set_tapes_evidencia', {
    taskboard_id: taskboardId,
    evidencia: nextList as unknown as never,
  });
  if (error) {
    // Best-effort: limpar o que foi carregado nesta chamada.
    await supabase.storage.from(BUCKET).remove(uploaded.map((f) => f.path));
    return { data: null, error: error.message };
  }
  return { data: nextList, error: null };
}

/** Remove um ficheiro de evidência da ficha (e do Storage). */
export async function removeTapesEvidencia(
  taskboardId: string,
  existing: TapesEvidenciaFile[],
  path: string,
): Promise<{ data: TapesEvidenciaFile[] | null; error: string | null }> {
  const nextList = existing.filter((f) => f.path !== path);
  const { error } = await supabase.rpc('set_tapes_evidencia', {
    taskboard_id: taskboardId,
    evidencia: nextList as unknown as never,
  });
  if (error) return { data: null, error: error.message };

  await supabase.storage.from(BUCKET).remove([path]);
  return { data: nextList, error: null };
}

/** Descarrega o conteúdo de um ficheiro de evidência. */
export async function downloadTapesEvidencia(path: string): Promise<Blob | null> {
  const { data, error } = await supabase.storage.from(BUCKET).download(path);
  if (error) {
    console.error('Erro ao descarregar evidência de tapes:', error);
    return null;
  }
  return data;
}
