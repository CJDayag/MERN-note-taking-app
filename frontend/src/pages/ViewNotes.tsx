import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Edit2, Archive, Trash2, Pin, Save, Loader2, Tag, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import MarkdownPreview from '@/components/markdown/MarkdownPreview';
import config from '@/config';

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
  userId: string;
}

const colorOptions = [
  { name: 'Default', value: 'default', class: 'bg-card border' },
  { name: 'Red', value: 'red', class: 'bg-red-100 dark:bg-red-950/30' },
  { name: 'Orange', value: 'orange', class: 'bg-orange-100 dark:bg-orange-950/30' },
  { name: 'Yellow', value: 'yellow', class: 'bg-yellow-100 dark:bg-yellow-950/30' },
  { name: 'Green', value: 'green', class: 'bg-green-100 dark:bg-green-950/30' },
  { name: 'Blue', value: 'blue', class: 'bg-blue-100 dark:bg-blue-950/30' },
  { name: 'Purple', value: 'purple', class: 'bg-purple-100 dark:bg-purple-950/30' },
  { name: 'Pink', value: 'pink', class: 'bg-pink-100 dark:bg-pink-950/30' },
];

export default function ViewNotes() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [note, setNote] = useState<Note | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  // Edit form state
  const [editedNote, setEditedNote] = useState<Partial<Note>>({});
  const [newTagInput, setNewTagInput] = useState('');
  
  // Fetch note data
  useEffect(() => {
    const fetchNote = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`${config.apiUrl}/notes/${id}`, {
          ...config.defaultFetchOptions,
        });
        
        if (!response.ok) {
          if (response.status === 404) {
            toast.error('This note may have been deleted or you don\'t have permission to view it.',
            );
            navigate('/notes');
            return;
          }
          
          if (response.status === 401) {
            navigate('/login');
            return;
          }
          
          throw new Error('Failed to fetch note');
        }
        
        const data = await response.json();
        setNote(data);
        setEditedNote(data);
      } catch (error) {
        toast.error( 'Failed to load note. Please try again later.',
        );
        navigate('/notes');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (id) {
      fetchNote();
    }
  }, [id, navigate, toast]);
  
  // Format dates
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };
  
  // Handle form changes
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setEditedNote(prev => ({ ...prev, [name]: value }));
  };
  
  // Toggle pin status
  const handleTogglePin = async () => {
    if (!note) return;
    
    try {
      const response = await fetch(`${config.apiUrl}/notes/${note._id}/pin`, {
        method: 'PATCH',
        ...config.defaultFetchOptions,
      });
      
      if (!response.ok) throw new Error('Failed to update pin status');
      
      const data = await response.json();
      setNote(prev => prev ? { ...prev, isPinned: data.isPinned } : null);
      
      toast.info(data.isPinned ? 'Note pinned' : 'Note unpinned', {
        description: data.isPinned 
          ? 'This note will now appear at the top of your notes' 
          : 'This note will no longer be pinned',
      });
    } catch (error) {
      toast.error("Error", {
        description: 'Failed to update pin status',
      });
    }
  };
  
  // Toggle archive status
  const handleToggleArchive = async () => {
    if (!note) return;
    
    try {
      const response = await fetch(`${config.apiUrl}/notes/${note._id}/archive`, {
        method: 'PATCH',
        ...config.defaultFetchOptions,
      });
      
      if (!response.ok) throw new Error('Failed to update archive status');
      
      const data = await response.json();
      
      if (data.isArchived) {
        toast.info('Note archived',{
          description: 'This note has been moved to your archive',
        });
        // Navigate back to notes list since this note is now archived
        navigate('/notes');
      } else {
        setNote(prev => prev ? { ...prev, isArchived: false } : null);
        toast.info('Note unarchived',{
          description: 'This note has been restored from your archive',
        });
      }
    } catch (error) {
      toast('Error',{
        description: 'Failed to update archive status',
      });
    }
  };
  
  // Delete note
  const handleDelete = async () => {
    if (!note) return;
    
    try {
      const response = await fetch(`${config.apiUrl}/notes/${note._id}`, {
        method: 'DELETE',
        ...config.defaultFetchOptions,
      });
      
      if (!response.ok) throw new Error('Failed to delete note');
      
      toast.success('Note deleted',{
        description: 'Your note has been permanently deleted',
      });
      
      navigate('/notes');
    } catch (error) {
      toast.error('Error',{
        description: 'Failed to delete note',
      });
    } finally {
      setShowDeleteDialog(false);
    }
  };
  
  // Save edited note
  const handleSaveEdit = async () => {
    if (!note || !editedNote.title || !editedNote.content) {
      toast.error('Invalid input',{
        description: 'Title and content are required',
      });
      return;
    }
    
    setIsSaving(true);
    try {
      const response = await fetch(`${config.apiUrl}/notes/${note._id}`, {
        method: 'PUT',
        ...config.defaultFetchOptions,
        body: JSON.stringify(editedNote),
      });
      
      if (!response.ok) throw new Error('Failed to update note');
      
      const updatedNote = await response.json();
      setNote(updatedNote);
      setIsEditing(false);
      
      toast.success('Note updated',{
        description: 'Your changes have been saved',
      });
    } catch (error) {
      toast.error('Error',{
        description: 'Failed to update note',
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  // Handle tag addition
  const handleAddTag = () => {
    if (!newTagInput.trim() || !editedNote.tags) return;
    
    if (!editedNote.tags.includes(newTagInput.trim())) {
      setEditedNote(prev => ({
        ...prev,
        tags: [...(prev.tags || []), newTagInput.trim()],
      }));
    }
    
    setNewTagInput('');
  };
  
  // Handle tag removal
  const handleRemoveTag = (tagToRemove: string) => {
    setEditedNote(prev => ({
      ...prev,
      tags: (prev.tags || []).filter(tag => tag !== tagToRemove),
    }));
  };
  
  // Handle color change
  const handleColorChange = (color: string) => {
    setEditedNote(prev => ({ ...prev, color }));
  };
  
  // Get background color class
  const getNoteColorClass = () => {
    if (!note || !note.color || note.color === 'default') return '';
    return colorOptions.find(c => c.value === note.color)?.class || '';
  };

  // Get edited note color class
  const getEditedNoteColorClass = () => {
    if (!editedNote.color || editedNote.color === 'default') return '';
    return colorOptions.find(c => c.value === editedNote.color)?.class || '';
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (!note) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold">Note not found</h2>
          <p className="text-muted-foreground mt-2">
            The note you're looking for doesn't exist or you don't have permission to view it.
          </p>
          <Button 
            className="mt-4" 
            onClick={() => navigate('/notes')}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Go back to notes
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate('/notes')}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back to Notes
          </Button>
          
          <div className="flex items-center gap-2">
            {!isEditing ? (
              <>
                <Button
                  variant={note.isPinned ? "secondary" : "outline"}
                  size="sm"
                  onClick={handleTogglePin}
                  title={note.isPinned ? "Unpin note" : "Pin note"}
                >
                  <Pin className={`h-4 w-4 ${note.isPinned ? "mr-2" : ""}`} />
                  {note.isPinned && "Pinned"}
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit2 className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleToggleArchive}
                >
                  <Archive className="h-4 w-4 mr-2" />
                  {note.isArchived ? "Unarchive" : "Archive"}
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDeleteDialog(true)}
                  className="text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </>
            ) : (
              <>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm">
                      {editedNote.color === 'default' ? 'Color' : 'Colored'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-2">
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Note Color</h4>
                      <div className="grid grid-cols-4 gap-2">
                        {colorOptions.map((color) => (
                          <div
                            key={color.value}
                            className={`h-8 rounded-md cursor-pointer border-2 ${
                              editedNote.color === color.value
                                ? 'border-primary'
                                : 'border-transparent'
                            } ${color.class}`}
                            title={color.name}
                            onClick={() => handleColorChange(color.value)}
                          />
                        ))}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setIsEditing(false);
                    setEditedNote(note);
                  }}
                >
                  Cancel
                </Button>
                
                <Button
                  size="sm"
                  onClick={handleSaveEdit}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save
                    </>
                  )}
                </Button>
              </>
            )}
          </div>
        </div>
        
        <div className={`p-6 rounded-lg border ${!isEditing ? getNoteColorClass() : getEditedNoteColorClass()}`}>
          {!isEditing ? (
            <div className="space-y-6">
              <h1 className="text-2xl font-bold">{note.title}</h1>
              
              {note.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {note.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      <Tag className="h-3 w-3 mr-1" />
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
              
              <div className="prose prose-neutral dark:prose-invert max-w-none">
                <MarkdownPreview content={note.content} />
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <Input
                  name="title"
                  value={editedNote.title || ''}
                  onChange={handleChange}
                  placeholder="Note Title"
                  className="text-xl font-semibold border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 p-0 h-auto"
                />
              </div>
              
              <div className="flex flex-wrap gap-1 mb-2">
                {editedNote.tags?.map((tag) => (
                  <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                    <Tag className="h-3 w-3" />
                    {tag}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-4 w-4 rounded-full"
                      onClick={() => handleRemoveTag(tag)}
                    >
                      <X className="h-2 w-2" />
                    </Button>
                  </Badge>
                ))}
                <div className="flex items-center gap-2 my-1">
                  <Input
                    value={newTagInput}
                    onChange={(e) => setNewTagInput(e.target.value)}
                    placeholder="Add tag..."
                    className="h-7 text-xs w-24 focus-visible:ring-1"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs"
                    onClick={handleAddTag}
                  >
                    Add
                  </Button>
                </div>
              </div>
              
              <div>
                <Textarea
                  name="content"
                  value={editedNote.content || ''}
                  onChange={handleChange}
                  placeholder="Note content (supports markdown)..."
                  className="min-h-[300px] resize-y border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 p-0"
                />
              </div>
            </div>
          )}
        </div>
        
        <div className="mt-6 flex flex-col sm:flex-row justify-between text-sm text-muted-foreground">
          <div>
            Created: {formatDate(note.createdAt)}
          </div>
          <div>
            Last modified: {formatDate(note.lastModified)}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Note</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this note? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
