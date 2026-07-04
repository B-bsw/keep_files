import { ChevronRight, Home } from "lucide-react";

type Crumb = { id: string; name: string };

type Props = {
  crumbs: Crumb[];
  onNavigate: (folderId: string | null) => void;
};

export function FolderBreadcrumb({ crumbs, onNavigate }: Props) {
  return (
    <nav className="flex items-center gap-1 text-sm mb-4">
      <button
        onClick={() => onNavigate(null)}
        className="flex items-center gap-1 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
      >
        <Home className="w-4 h-4" />
      </button>
      {crumbs.map((crumb, i) => (
        <span key={crumb.id} className="flex items-center gap-1">
          <ChevronRight className="w-3.5 h-3.5 text-gray-400 dark:text-gray-600" />
          {i === crumbs.length - 1 ? (
            <span className="text-gray-900 dark:text-white font-medium">{crumb.name}</span>
          ) : (
            <button
              onClick={() => onNavigate(crumb.id)}
              className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              {crumb.name}
            </button>
          )}
        </span>
      ))}
    </nav>
  );
}
