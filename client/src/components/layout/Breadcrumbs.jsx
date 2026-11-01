import { Link, useLocation } from 'react-router-dom';

const LABELS = {
  products: 'Products',
  dashboard: 'Dashboard',
  messaging: 'Messages',
  login: 'Login',
  register: 'Register',
  seller: 'Seller',
};

export default function Breadcrumbs() {
  const { pathname } = useLocation();
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length === 0) return null;

  const crumbs = segments.map((seg, i) => {
    const path = '/' + segments.slice(0, i + 1).join('/');
    const label = LABELS[seg] || seg;
    return { path, label };
  });

  return (
    <nav aria-label="Breadcrumb" className="px-6 py-2 text-sm text-gray-500">
      <ol className="flex flex-wrap items-center gap-1">
        <li>
          <Link to="/" className="hover:underline">Home</Link>
        </li>
        {crumbs.map((c, i) => (
          <li key={c.path} className="flex items-center gap-1">
            <span>/</span>
            {i === crumbs.length - 1 ? (
              <span className="text-gray-900">{c.label}</span>
            ) : (
              <Link to={c.path} className="hover:underline">{c.label}</Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
