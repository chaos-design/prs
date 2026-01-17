import { Workflow } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

interface HeaderProps {
  level: string;
  onLevelChange: (level: string) => void;
}

export default function Header(_props: HeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <header className='border-b border-slate-200 bg-white/80 backdrop-blur sticky top-0 z-50'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4'>
        <div className='flex items-center gap-3 min-w-0'>
          <div className='h-9 w-9 rounded-xl bg-gradient-to-tr from-brand-500 to-indigo-400 flex items-center justify-center text-white shadow-md shadow-indigo-200/80 flex-shrink-0'>
            <Workflow className='h-5 w-5' />
          </div>
          <div className='hidden md:block'>
            <h1 className='text-lg font-semibold tracking-tight truncate'>
              核心词汇形态学词典
            </h1>
            <p className='text-xs text-slate-500 truncate'>
              按前缀 · 词根 · 后缀与短语分维度探索词汇
            </p>
          </div>
        </div>

        {/* Center Tabs */}
        <div className='flex-1 flex justify-center'>
          <div className='inline-flex rounded-full bg-slate-100 p-1 text-xs font-medium text-slate-500 shadow-inner'>
            <button
              type='button'
              className={`px-4 py-1.5 rounded-full transition-all duration-200 ${currentPath === '/'
                ? 'bg-white text-brand-600 shadow-sm ring-1 ring-slate-200'
                : 'hover:text-slate-700'
                }`}
              onClick={() => navigate('/')}
            >
              单词学习
            </button>
            <button
              type='button'
              className={`px-4 py-1.5 rounded-full transition-all duration-200 ${currentPath === '/scenarios'
                ? 'bg-white text-brand-600 shadow-sm ring-1 ring-slate-200'
                : 'hover:text-slate-700'
                }`}
              onClick={() => navigate('/scenarios')}
            >
              场景例句
            </button>
          </div>
        </div>

        <div className='flex items-center gap-3 flex-shrink-0'>
          <a
            href='https://github.com/chaos-design/prs'
            target='_blank'
            rel='noopener noreferrer'
            className='text-slate-400 hover:text-slate-600 transition-colors p-2'
          >
            <svg
              role='img'
              viewBox='0 0 24 24'
              xmlns='http://www.w3.org/2000/svg'
              className='w-6 h-6 fill-current text-[#181717]'
            >
              <title>GitHub</title>
              <path d='M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12' />
            </svg>
          </a>
          <a
            href='https://github.com/rain120'
            target='_blank'
            rel='noopener noreferrer'
            className='text-slate-400 hover:text-slate-600 transition-colors p-2'
          >
            <img src="https://avatars.githubusercontent.com/u/20939839?v=4" alt="avatar" className="w-7 h-7 rounded-full border" />
          </a>
        </div>
      </div>
    </header>
  );
}
