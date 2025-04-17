import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Tag, Archive, ChevronLeft, ArrowUpFromLine, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from "sonner"
import config from '@/config';
import NoteCard from '@/components/notes/NoteCard';
import EmptyState from '@/components/EmptyState';

// Define types for our note data
interface Note {
  _id: string;
  title: string;
  content: string;
  tags: string[];
  color: string;
  isPinned: boolean;
  isArchived: boolean;
  lastModified: string;
  createdAt: string;
}

export default function ArchivedNotes() {
  const navigate = useNavigate();
  
  const [archivedNotes, setArchivedNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>([]);

  // Function to fetch archived notes
  const fetchArchivedNotes = async () => {
    setIsLoading(true);
    try {
      let url = `${config.apiUrl}/notes?archived=true`;
      const params = new URLSearchParams();
      
      if (searchTerm) {
        params.append('search', searchTerm);
      }
      
      if (selectedTag) {
        params.append('tag', selectedTag);
      }
      
      if (params.toString()) {
        url += `&${params.toString()}`;
      }
      
      const response = await fetch(url, {
        ...config.defaultFetchOptions,
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          navigate('/login');
          return;
        }
        throw new Error('Failed to fetch archived notes');
      }
      
      const data = await response.json();
      setArchivedNotes(data);
    } catch (error) {
      toast.error( error instanceof Error ? error.message : 'Failed to load archived notes',
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Function to fetch tags from archived notes
  const fetchTags = async () => {
    try {
      const response = await fetch(`${config.apiUrl}/tags`, {
        ...config.defaultFetchOptions,
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch tags');
      }
      
      const data = await response.json();
      setTags(data);
    } catch (error) {
      console.error('Error fetching tags:', error);
    }
  };

  // Load notes and tags on component mount
  useEffect(() => {
    fetchArchivedNotes();
    fetchTags();
  }, []);

  // Reload notes when search or tag filter changes
  useEffect(() => {
    fetchArchivedNotes();
  }, [searchTerm, selectedTag]);

  // Function to unarchive a note
  const unarchiveNote = async (noteId: string) => {
    try {
      const response = await fetch(`${config.apiUrl}/notes/${noteId}/archive`, {
        method: 'PATCH',
        ...config.defaultFetchOptions,
      });
      
      if (!response.ok) {
        throw new Error('Failed to unarchive note');
      }
      
      // Remove the unarchived note from the current view
      setArchivedNotes(prevNotes => prevNotes.filter(note => note._id !== noteId));
      
      toast.success('Note moved back to active notes',
      );
    } catch (error) {
      toast.error( error instanceof Error ? error.message : 'Failed to unarchive note',
      );
    }
  };

  // Function to delete a note
  const deleteNote = async (noteId: string) => {
    if (!confirm('Are you sure you want to permanently delete this note?')) {
      return;
    }
    
    try {
      const response = await fetch(`${config.apiUrl}/notes/${noteId}`, {
        method: 'DELETE',
        ...config.defaultFetchOptions,
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete note');
      }
      
      // Remove the deleted note from the state
      setArchivedNotes(prevNotes => prevNotes.filter(note => note._id !== noteId));
      
      toast.success( 'Note deleted permanently',
      );
    } catch (error) {
      toast.error( error instanceof Error ? error.message : 'Failed to delete note',
      );
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8">
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => navigate('/notes')}
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back to Notes
        </Button>
        
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold flex items-center">
            <Archive className="mr-2 h-6 w-6 text-muted-foreground" />
            Archived Notes
          </h1>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search archived notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex gap-2 overflow-x-auto pb-2">
            {tags.map(tag => (
              <Badge 
                key={tag}
                variant={selectedTag === tag ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
              >
                <Tag className="h-3 w-3 mr-1" />
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      </header>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : (
        <section>
          {archivedNotes.length === 0 ? (
            <EmptyState 
              title="No archived notes found"
              description={
                searchTerm || selectedTag 
                  ? "Try adjusting your search or filters" 
                  : "Your archive is empty"
              }
              icon={<Archive className="h-16 w-16" />}
              action={
                <Button variant="outline" onClick={() => navigate('/notes')}>
                  Return to Active Notes
                </Button>
              }
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {archivedNotes.map(note => (
                <ArchivedNoteCard
                  key={note._id}
                  note={note}
                  onUnarchive={() => unarchiveNote(note._id)}
                  onDelete={() => deleteNote(note._id)}
                  onClick={() => navigate(`/notes/${note._id}`)}
                />
              ))}
            </div>
          )}
        </section>
      )}

      <div className="mt-10 p-4 bg-muted/30 rounded-lg border border-dashed border-muted">
        <h3 className="font-medium mb-2">About the Archive</h3>
        <p className="text-sm text-muted-foreground">
          Archived notes are stored here but don't appear in your main notes view. You can restore them anytime or permanently delete notes you no longer need.
        </p>
      </div>
    </div>
  );
}

// Special component for archived notes
function ArchivedNoteCard({ 
  note, 
  onClick, 
  onUnarchive, 
  onDelete 
}: { 
  note: Note;
  onClick: () => void;
  onUnarchive: () => void;
  onDelete: () => void;
}) {
  // Simplified version of NoteCard customized for archived notes
  return (
    <NoteCard
      note={note}
      onClick={onClick}
      customActions={
        <div className="flex gap-1">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8"
            onClick={(e) => {
              e.stopPropagation();
              onUnarchive();
            }}
            title="Restore from archive"
          >
            <ArrowUpFromLine className="h-4 w-4" />
          </Button>
          
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 text-destructive/80 hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            title="Delete permanently"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      }
    />
  );
}
