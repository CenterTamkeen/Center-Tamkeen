import Link from "next/link";

type PaginationProps = {
  basePath?: string;
  page: number;
  totalPages: number;
  searchParams: Record<string, string | undefined>;
};

function getHref(
  basePath: string,
  page: number,
  searchParams: Record<string, string | undefined>,
) {
  const params = new URLSearchParams();

  Object.entries(searchParams).forEach(([key, value]) => {
    if (value) {
      params.set(key, value);
    }
  });

  params.set("page", String(page));
  return `${basePath}?${params.toString()}`;
}

export function Pagination({
  basePath = "/courses",
  page,
  totalPages,
  searchParams,
}: PaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <nav className="flex flex-wrap items-center justify-center gap-3 pt-4">
      {page > 1 ? (
        <Link
          href={getHref(basePath, page - 1, searchParams)}
          className="btn-secondary gap-2 px-5 py-2.5"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
          السابق
        </Link>
      ) : null}

      <div className="glass-panel flex items-center gap-1 rounded-lg px-4 py-2">
        <span className="text-primary-700 text-sm font-bold">
          {page.toLocaleString("ar-EG")}
        </span>
        <span className="text-foreground/50 text-sm">من</span>
        <span className="text-foreground/70 text-sm font-bold">
          {totalPages.toLocaleString("ar-EG")}
        </span>
      </div>

      {page < totalPages ? (
        <Link
          href={getHref(basePath, page + 1, searchParams)}
          className="btn-secondary gap-2 px-5 py-2.5"
        >
          التالي
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </Link>
      ) : null}
    </nav>
  );
}
