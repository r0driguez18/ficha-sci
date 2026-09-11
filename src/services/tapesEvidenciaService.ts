import { supabase } from '@/integrations/supabase/client';
import type { TapesEvidenciaFile } from '@/types/taskboard';

/**
 * Prova do "display-tape" (folha de verificação de tapes).
 *
 * O ficheiro (PDF ou TXT) é guardado no bucket privado `tapes-evidencia`; a
 * lista de ficheiros anexados a cada ficha é gravada (um de cada vez, nunca
 * a lista inteira substituída) pelas funções `adicionar_evidencia_tapes` /
 * `remover_evidencia_tapes` (SECURITY DEFINER), que também confirmam no
 * servidor que o ficheiro existe mesmo no bucket e atualizam o
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
 * Carrega um ou mais ficheiros de evidência e junta-os aos já existentes —
 * um de cada vez, via `adicionar_evidencia_tapes` (RPC), que confirma no
 * servidor que o ficheiro existe mesmo no bucket e pertence a quem está a
 * chamar, e ACRESCENTA (nunca substitui a lista inteira) — duas pessoas a
 * anexar quase ao mesmo tempo já não perdem uma o anexo da outra.
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

  let lista = existing;
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

    const { data, error } = await supabase.rpc('adicionar_evidencia_tapes', {
      p_taskboard_id: taskboardId,
      p_path: path,
      p_name: file.name,
      p_size: file.size,
      p_type: type,
    });
    if (error) {
      // Best-effort: limpar o que foi carregado nesta chamada.
      await supabase.storage.from(BUCKET).remove([path]);
      return { data: null, error: error.message };
    }
    lista = (data ?? []) as unknown as TapesEvidenciaFile[];
  }

  return { data: lista, error: null };
}

/** Remove um ficheiro de evidência da ficha (e do Storage). */
export async function removeTapesEvidencia(
  taskboardId: string,
  path: string,
): Promise<{ data: TapesEvidenciaFile[] | null; error: string | null }> {
  const { data, error } = await supabase.rpc('remover_evidencia_tapes', {
    p_taskboard_id: taskboardId,
    p_path: path,
  });
  if (error) return { data: null, error: error.message };
  return { data: (data ?? []) as unknown as TapesEvidenciaFile[], error: null };
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
