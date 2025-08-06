import React, { useState, useMemo } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SearchSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  items: Array<{
    label: string;
    path: string;
    keywords?: string[];
  }>;
  onNavigate: (path: string) => void;
}

export function SearchSidebar({ isOpen, onClose, items, onNavigate }: SearchSidebarProps) {
  const [query, setQuery] = useState('');

  const filteredItems = useMemo(() => {
    if (!query.trim()) return items;
    
    const searchTerm = query.toLowerCase();
    return items.filter(item => 
      item.label.toLowerCase().includes(searchTerm) ||
      item.keywords?.some(keyword => keyword.toLowerCase().includes(searchTerm))
    );
  }, [items, query]);

  const handleItemClick = (path: string) => {
    onNavigate(path);
    onClose();
    setQuery('');
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />
      
      {/* Search Panel */}
      <div className="fixed left-64 top-0 bottom-0 w-80 bg-background border-r border-border z-50 animate-slide-in">
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Pesquisar</h2>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Pesquisar páginas..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10"
              autoFocus
            />
          </div>
        </div>
        
        <div className="p-4 overflow-y-auto">
          {filteredItems.length > 0 ? (
            <div className="space-y-2">
              {filteredItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => handleItemClick(item.path)}
                  className={cn(
                    "w-full text-left p-3 rounded-md transition-colors",
                    "hover:bg-accent hover:text-accent-foreground",
                    "focus:bg-accent focus:text-accent-foreground focus:outline-none"
                  )}
                >
                  <div className="font-medium">{item.label}</div>
                  <div className="text-xs text-muted-foreground">{item.path}</div>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-8">
              <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Nenhum resultado encontrado</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}