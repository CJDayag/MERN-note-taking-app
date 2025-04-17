import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Tag, Archive, Pin, User } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from "sonner";
import { Badge } from '@/components/ui/badge';
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

export default function Dashboard() {
  const navigate = useNavigate();
  
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>([]);

  // Function to fetch notes
  const fetchNotes = async () => {
    setIsLoading(true);
    try {
      let url = `${config.apiUrl}/notes`;
      const params = new URLSearchParams();
      
      if (searchTerm) {
        params.append('search', searchTerm);
      }
      
      if (selectedTag) {
        params.append('tag', selectedTag);
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const response = await fetch(url, {
        ...config.defaultFetchOptions,
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          navigate('/login');
          return;
        }
        throw new Error('Failed to fetch notes');
      }
      
      const data = await response.json();
      setNotes(data);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load notes',
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Function to fetch tags
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
    fetchNotes();
    fetchTags();
  }, []);

  // Reload notes when search or tag filter changes
  useEffect(() => {
    fetchNotes();
  }, [searchTerm, selectedTag]);

  // Function to toggle pin status
  const togglePin = async (noteId: string) => {
    try {
      const response = await fetch(`${config.apiUrl}/notes/${noteId}/pin`, {
        method: 'PATCH',
        ...config.defaultFetchOptions,
      });
      
      if (!response.ok) {
        throw new Error('Failed to update pin status');
      }
      
      // Update the notes state to reflect the change
      setNotes(prevNotes => 
        prevNotes.map(note => 
          note._id === noteId ? { ...note, isPinned: !note.isPinned } : note
        )
      );
      
      toast.success( 'Pin status updated',
      );
    } catch (error) {
      toast.error( error instanceof Error ? error.message : 'Failed to update pin status',
      );
    }
  };

  // Function to archive a note
  const archiveNote = async (noteId: string) => {
    try {
      const response = await fetch(`${config.apiUrl}/notes/${noteId}/archive`, {
        method: 'PATCH',
        ...config.defaultFetchOptions,
      });
      
      if (!response.ok) {
        throw new Error('Failed to archive note');
      }
      
      // Remove the archived note from the current view
      setNotes(prevNotes => prevNotes.filter(note => note._id !== noteId));
      
      toast.success('Note archived successfully',
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to archive note',
      );
    }
  };

  // Function to delete a note
  const deleteNote = async (noteId: string) => {
    if (!confirm('Are you sure you want to delete this note?')) {
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
      setNotes(prevNotes => prevNotes.filter(note => note._id !== noteId));
      
      toast.success('Note deleted successfully',
      );
    } catch (error) {
      toast.error( error instanceof Error ? error.message : 'Failed to delete note',
      );
    }
  };

  // Filter notes for pinned and unpinned sections
  const pinnedNotes = notes.filter(note => note.isPinned);
  const unpinnedNotes = notes.filter(note => !note.isPinned);

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">My Notes</h1>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => navigate('/profile')}
              title="Profile"
            >
              <User className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => navigate('/notes/archived')}
              title="Archived Notes"
            >
              <Archive className="h-4 w-4" />
            </Button>
            <Button 
              onClick={() => navigate('/notes/new')}
            >
              <Plus className="h-4 w-4 mr-2" />
              New Note
            </Button>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search notes..."
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
        <>
          {/* Pinned Notes Section */}
          {pinnedNotes.length > 0 && (
            <section className="mb-10">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <Pin className="h-4 w-4 mr-2 text-primary" />
                Pinned Notes
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pinnedNotes.map(note => (
                  <NoteCard
                    key={note._id}
                    note={note}
                    onPin={() => togglePin(note._id)}
                    onArchive={() => archiveNote(note._id)}
                    onDelete={() => deleteNote(note._id)}
                    onClick={() => navigate(`/notes/${note._id}`)}
                  />
                ))}
              </div>
            </section>
          )}
          
          {/* All Notes Section */}
          <section>
            <h2 className="text-xl font-semibold mb-4">All Notes</h2>
            
            {notes.length === 0 ? (
              <EmptyState 
                title="No notes found"
                description={
                  searchTerm || selectedTag 
                    ? "Try adjusting your search or filters" 
                    : "Create your first note to get started"
                }
                action={
                  <Button onClick={() => navigate('/notes/new')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create a Note
                  </Button>
                }
              />
            ) : unpinnedNotes.length === 0 && pinnedNotes.length > 0 ? (
              <p className="text-center text-muted-foreground py-6">
                All your notes are pinned. Add more notes or unpin some.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {unpinnedNotes.map(note => (
                  <NoteCard
                    key={note._id}
                    note={note}
                    onPin={() => togglePin(note._id)}
                    onArchive={() => archiveNote(note._id)}
                    onDelete={() => deleteNote(note._id)}
                    onClick={() => navigate(`/notes/${note._id}`)}
                  />
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
