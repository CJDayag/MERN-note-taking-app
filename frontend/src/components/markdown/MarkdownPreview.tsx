import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import type { Components } from 'react-markdown';

interface MarkdownPreviewProps {
  content: string;
}
const CodeBlock = ({
    inline,
    className,
    children,
    ...props
  }: any) => {
    const match = /language-(\w+)/.exec(className || '');
    return !inline && match ? (
      <SyntaxHighlighter
        style={vscDarkPlus}
        language={match[1]}
        PreTag="div"
        className="rounded-md my-4"
        {...props}
      >
        {String(children).replace(/\n$/, '')}
      </SyntaxHighlighter>
    ) : (
      <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
        {children}
      </code>
    );
  };
  
  

const components: Components = {
    h1: ({ node, ...props }) => <h1 className="text-2xl font-bold" {...props} />,
    h2: ({ node, ...props }) => <h2 className="text-xl font-bold" {...props} />,
    h3: ({ node, ...props }) => <h3 className="text-lg font-bold" {...props} />,
    h4: ({ node, ...props }) => <h4 className="text-md font-bold" {...props} />,
    h5: ({ node, ...props }) => <h5 className="text-sm font-bold" {...props} />,
    h6: ({ node, ...props }) => <h6 className="text-xs font-bold" {...props} />,
    p: ({ node, ...props }) => <p className="my-2" {...props} />,
    blockquote: ({ node, ...props }) => (
      <blockquote className="border-l-4 border-muted pl-4 italic my-2" {...props} />
    ),
    ul: ({ node, ...props }) => <ul className="list-disc list-inside my-2" {...props} />,
    code: CodeBlock,
  };

export default function MarkdownPreview({ content }: MarkdownPreviewProps) {
  const [isMounted, setIsMounted] = useState(false);
  
  // To avoid hydration issues with SSR
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  if (!isMounted) {
    return <div className="animate-pulse bg-muted h-64 rounded-md" />;
  }
  
  return (
    <div className="break-words">
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={components}
    >
      {content}
    </ReactMarkdown>
    </div>
  );
}
