import * as React from "react"
import { cn } from "../../lib/utils"
import { useState, useRef, useEffect } from "react"

export interface SelectProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value: string;
  onChange: (e: { target: { value: string } }) => void;
  children: React.ReactNode;
}

const Select = React.forwardRef<HTMLDivElement, SelectProps>(
  ({ className, children, value, onChange, ...props }, ref) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    
    // Convert children to options array
    const options = React.Children.toArray(children).map((child: any) => ({
      value: child.props.value,
      label: child.props.children
    }));

    const selectedLabel = options.find(opt => opt.value === value)?.label || value;

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
          setIsOpen(false);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (newValue: string) => {
      onChange({ target: { value: newValue } });
      setIsOpen(false);
    };

    return (
      <div className="relative" ref={containerRef}>
        <div
          className={cn(
            "flex h-9 w-full items-center justify-between rounded-md border border-slate-200 bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:ring-offset-slate-950 dark:focus:ring-slate-300 cursor-pointer hover:bg-slate-50",
            className
          )}
          onClick={() => setIsOpen(!isOpen)}
          ref={ref}
        >
          <span className="truncate">{selectedLabel}</span>
          <span className="pointer-events-none flex items-center text-slate-500 ml-2">
             <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`lucide lucide-chevron-down h-4 w-4 opacity-50 transition-transform ${isOpen ? 'rotate-180' : ''}`}><path d="m6 9 6 6 6-6"/></svg>
          </span>
        </div>
        
        {isOpen && (
          <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-slate-200 bg-white p-1 text-slate-950 shadow-md ring-1 ring-slate-950/5 animate-in fade-in-0 zoom-in-95 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-50">
            {options.map((opt) => (
              <div
                key={opt.value}
                className={cn(
                  "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-slate-100 hover:text-slate-900 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 dark:hover:bg-slate-800 dark:hover:text-slate-50",
                  value === opt.value && "bg-slate-100 dark:bg-slate-800"
                )}
                onClick={() => handleSelect(opt.value)}
              >
                <span className="truncate">{opt.label}</span>
                {value === opt.value && (
                  <span className="ml-auto flex items-center pl-2 text-slate-950 dark:text-slate-50">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><polyline points="20 6 9 17 4 12"/></svg>
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }
)
Select.displayName = "Select"

export { Select }
