import { Pin, Archive, Trash2, Tag } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// Define types for note data
interface Note {
  _id: string;
  title: string;
  content: string;
  tags: string[];
  color: string;
  isPinned: boolean;
  lastModified: string;
}

// Update the interface to include optional customActions prop
interface NoteCardProps {
  note: Note;
  onClick: () => void;
  onPin?: () => void;
  onArchive?: () => void;
  onDelete?: () => void;
  customActions?: React.ReactNode; // Add this line for custom actions
}

// Function to truncate text
const truncateText = (text: string, maxLength: number) => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

// Function to convert markdown to plain preview
const renderPreview = (content: string) => {
  // Simple markdown stripping for preview purposes
  return content
    .replace(/#+\s/g, '') // Remove headers
    .replace(/\*\*/g, '')  // Remove bold
    .replace(/\*/g, '')    // Remove italic
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Replace links with link text
    .replace(/~~([^~]+)~~/g, '$1') // Remove strikethrough
    .replace(/`([^`]+)`/g, '$1')   // Remove inline code
    .replace(/```[\s\S]*?```/g, '') // Remove code blocks
    .replace(/>\s/g, '')  // Remove blockquotes
    .replace(/-\s/g, '')  // Remove list markers
};

// Map of color names to CSS classes
const colorMap = {
  default: 'bg-card',
  red: 'bg-red-50 dark:bg-red-950/30',
  orange: 'bg-orange-50 dark:bg-orange-950/30',
  yellow: 'bg-yellow-50 dark:bg-yellow-950/30',
  green: 'bg-green-50 dark:bg-green-950/30',
  blue: 'bg-blue-50 dark:bg-blue-950/30',
  purple: 'bg-purple-50 dark:bg-purple-950/30',
  pink: 'bg-pink-50 dark:bg-pink-950/30',
};

export default function NoteCard({ 
  note, 
  onClick, 
  onPin, 
  onArchive, 
  onDelete, 
  customActions 
}: NoteCardProps) {
  // Format the date
  const formattedDate = new Date(note.lastModified).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  
  // Prepare content preview
  const contentPreview = renderPreview(note.content);
  
  return (
    <Card 
      className={cn(
        "overflow-hidden transition-all hover:shadow-md cursor-pointer",
        note.color && colorMap[note.color as keyof typeof colorMap],
        note.isPinned && "border-primary/50"
      )}
      onClick={(e) => {
        // Only navigate if the click was on the card itself, not on a button
        if ((e.target as HTMLElement).closest('button')) {
          return;
        }
        onClick();
      }}
    >
      <CardHeader className="p-4 pb-2">
        <div className="flex items-start justify-between">
          <CardTitle className="text-xl line-clamp-2">{note.title}</CardTitle>
          {onPin && (
            <Button 
              variant="ghost" 
              size="icon" 
              className={cn("h-8 w-8", note.isPinned && "text-primary")}
              onClick={(e) => {
                e.stopPropagation();
                onPin();
              }}
            >
              <Pin className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="p-4 pt-0">
        <div className="text-sm text-muted-foreground line-clamp-4 min-h-[5rem]">
          {truncateText(contentPreview, 180)}
        </div>
      </CardContent>
      
      <CardFooter className="p-4 pt-2 flex flex-col items-start">
        <div className="flex flex-wrap gap-1 mb-2 w-full">
          {note.tags.map(tag => (
            <Badge key={tag} variant="outline" className="text-xs">
              <Tag className="h-3 w-3 mr-1" />
              {tag}
            </Badge>
          ))}
        </div>
        
        <div className="flex items-center justify-between w-full">
          <div className="text-xs text-muted-foreground">
            {formattedDate}
          </div>
          
          <div className="flex gap-1">
            {customActions ? (
              // Render custom actions if provided
              customActions
            ) : (
              // Otherwise render default actions
              <>
                {onArchive && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8"
                    onClick={(e) => {
                      e.stopPropagation();
                      onArchive();
                    }}
                  >
                    <Archive className="h-4 w-4" />
                  </Button>
                )}
                
                {onDelete && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-destructive/80 hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete();
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
