import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

const TextBlock = ({ content }) => {
  return (
    <div className="prose prose-invert max-w-none text-gray-100 my-2 leading-relaxed animate-in fade-in duration-300">
      <ReactMarkdown
        components={{
          code({ node, inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            return !inline && match ? (
              <div className="rounded-md overflow-hidden bg-[#1e1e1e] my-4 border border-gray-700 shadow-xl">
                 <div className="flex justify-between items-center px-4 py-1.5 bg-[#252526] border-b border-gray-700">
                    <span className="text-xs text-gray-400 font-mono">{match[1]}</span>
                    <div className="flex gap-2">
                        {/* Copy button could go here */}
                    </div>
                </div>
                <SyntaxHighlighter
                  style={vscDarkPlus}
                  language={match[1]}
                  PreTag="div"
                  customStyle={{ margin: 0, padding: '1rem', background: 'transparent' }}
                  {...props}
                >
                  {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
              </div>
            ) : (
              <code className={`${className} bg-gray-800 px-1 py-0.5 rounded text-sm text-pink-300 font-mono`} {...props}>
                {children}
              </code>
            );
          },
          // Customize links to open in new tab
          a: ({ node, ...props }) => <a target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 transition-colors" {...props} />,
          // Enhance headers
          h1: ({ node, ...props }) => <h1 className="text-2xl font-bold text-white mt-6 mb-4 border-b border-gray-700 pb-2" {...props} />,
          h2: ({ node, ...props }) => <h2 className="text-xl font-bold text-white mt-5 mb-3" {...props} />,
          p: ({ node, ...props }) => <p className="mb-4 last:mb-0" {...props} />,
          ul: ({ node, ...props }) => <ul className="list-disc pl-6 mb-4 space-y-1" {...props} />,
          ol: ({ node, ...props }) => <ol className="list-decimal pl-6 mb-4 space-y-1" {...props} />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default TextBlock;
