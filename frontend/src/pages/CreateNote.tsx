import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Tag, Save, Palette, Loader2, X } from 'lucide-react';
import { debounce } from 'lodash-es';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import MarkdownPreview from '@/components/markdown/MarkdownPreview';
import config from '@/config';

interface Draft {
  _id?: string;
  title: string;
  content: string;
  tags: string[];
  color: string;
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

export default function CreateNote() {
  const navigate = useNavigate();
  
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [newTagInput, setNewTagInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  
  // Note state
  const [note, setNote] = useState<Draft>({
    title: '',
    content: '',
    tags: [],
    color: 'default',
  });
  
  // Fetch existing draft if any
  useEffect(() => {
    const fetchDraft = async () => {
      try {
        const response = await fetch(`${config.apiUrl}/drafts/new`, {
          ...config.defaultFetchOptions,
        });
        
        if (response.ok) {
          const data = await response.json();
          setNote({
            _id: data._id,
            title: data.title || '',
            content: data.content || '',
            tags: data.tags || [],
            color: data.color || 'default',
          });
          setLastSaved(new Date(data.lastSaved));
        }
      } catch (error) {
        console.error('Error fetching draft:', error);
        // Not showing an error toast here as this is a normal scenario for new notes
      }
    };
    
    fetchDraft();
  }, []);
  
  // Auto-save with debounce
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const autoSaveDraft = useCallback(
    debounce(async (draftData: Draft) => {
      if (!draftData.title && !draftData.content) {
        return; // Don't save empty drafts
      }
      
      setIsAutoSaving(true);
      try {
        const response = await fetch(`${config.apiUrl}/drafts`, {
          method: 'POST',
          ...config.defaultFetchOptions,
          body: JSON.stringify(draftData),
        });
        
        if (response.ok) {
          const data = await response.json();
          if (!draftData._id) {
            setNote(prev => ({ ...prev, _id: data._id }));
          }
          setLastSaved(new Date());
        }
      } catch (error) {
        console.error('Error auto-saving draft:', error);
      } finally {
        setIsAutoSaving(false);
      }
    }, 1000),
    []
  );
  
  // Trigger auto-save when note changes
  useEffect(() => {
    autoSaveDraft(note);
  }, [note, autoSaveDraft]);
  
  // Handle note field changes
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setNote(prev => ({ ...prev, [name]: value }));
  };
  
  // Handle tag addition
  const handleAddTag = () => {
    if (!newTagInput.trim()) return;
    
    if (!note.tags.includes(newTagInput.trim())) {
      setNote(prev => ({
        ...prev,
        tags: [...prev.tags, newTagInput.trim()],
      }));
    }
    
    setNewTagInput('');
  };
  
  // Handle tag removal
  const handleRemoveTag = (tagToRemove: string) => {
    setNote(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove),
    }));
  };
  
  // Handle color change
  const handleColorChange = (color: string) => {
    setNote(prev => ({ ...prev, color }));
  };
  
  // Save note
  const handleSaveNote = async () => {
    if (!note.title || !note.content) {
      toast.error('Please provide both a title and content for your note.',
      );
      return;
    }
    
    setIsSaving(true);
    try {
      const response = await fetch(`${config.apiUrl}/notes`, {
        method: 'POST',
        ...config.defaultFetchOptions,
        body: JSON.stringify({
          ...note,
          draftId: note._id, // Include draft ID to clean up the draft after saving
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save note');
      }
      
      const savedNote = await response.json();
      
      toast.success('Note saved successfully.',
      );
      
      // Navigate to the note detail page
      navigate(`/notes/${savedNote._id}`);
    } catch (error) {
      toast.error('Failed to save note. Please try again.',
      );
    } finally {
      setIsSaving(false);
    }
  };
  
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
            {isAutoSaving && (
              <span className="text-sm text-muted-foreground flex items-center">
                <Loader2 className="h-3 w-3 animate-spin mr-1" />
                Saving...
              </span>
            )}
            
            {lastSaved && !isAutoSaving && (
              <span className="text-sm text-muted-foreground">
                Last saved: {lastSaved.toLocaleTimeString()}
              </span>
            )}
            
            <Button
              variant="outline"
              onClick={() => setIsPreviewMode(!isPreviewMode)}
            >
              {isPreviewMode ? 'Edit' : 'Preview'}
            </Button>
            
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="icon">
                  <Palette className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64">
                <div className="space-y-2">
                  <h4 className="font-medium">Note Color</h4>
                  <div className="grid grid-cols-4 gap-2">
                    {colorOptions.map((color) => (
                      <div
                        key={color.value}
                        className={`h-8 rounded-md cursor-pointer border-2 ${
                          note.color === color.value
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
              onClick={handleSaveNote}
              disabled={isSaving || !note.title || !note.content}
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Note
                </>
              )}
            </Button>
          </div>
        </div>
        
        <div className={`mb-4 ${note.color !== 'default' ? colorOptions.find(c => c.value === note.color)?.class : ''} rounded-lg border p-6`}>
          {!isPreviewMode ? (
            <div className="space-y-6">
              <div>
                <Input
                  name="title"
                  value={note.title}
                  onChange={handleChange}
                  placeholder="Note Title"
                  className="text-xl border-none bg-transparent font-semibold focus-visible:ring-0 focus-visible:ring-offset-0 p-0 h-auto"
                />
              </div>
              
              <div className="flex flex-wrap gap-1 mb-2">
                {note.tags.map((tag) => (
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
                  value={note.content}
                  onChange={handleChange}
                  placeholder="Note content (supports markdown)..."
                  className="min-h-[300px] resize-y border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 p-0"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <h1 className="text-2xl font-bold">{note.title || 'Untitled Note'}</h1>
              
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
          )}
        </div>
        
        <div className="text-sm text-muted-foreground mt-8">
          <p>
            <span className="font-medium">Tip:</span> This editor supports markdown formatting. You can use 
            <code className="mx-1 px-1 bg-muted rounded">**bold**</code>, 
            <code className="mx-1 px-1 bg-muted rounded">*italic*</code>, 
            <code className="mx-1 px-1 bg-muted rounded"># headings</code>, 
            <code className="mx-1 px-1 bg-muted rounded">- lists</code>, and more.
          </p>
        </div>
      </div>
    </div>
  );
}
