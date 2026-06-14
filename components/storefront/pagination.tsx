import Link from "next/link";

type PaginationProps = {
  page: number;
  totalPages: number;
  searchParams: Record<string, string | undefined>;
};

function getHref(
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
  return `/courses?${params.toString()}`;
}

export function Pagination({
  page,
  totalPages,
  searchParams,
}: PaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <nav className="flex flex-wrap items-center justify-center gap-2">
      {page > 1 ? (
        <Link
          href={getHref(page - 1, searchParams)}
          className="btn-secondary px-4 py-2"
        >
          السابق
        </Link>
      ) : null}

      <span className="text-foreground/65 px-3 py-2 text-sm">
        صفحة {page.toLocaleString("ar-EG")} من{" "}
        {totalPages.toLocaleString("ar-EG")}
      </span>

      {page < totalPages ? (
        <Link
          href={getHref(page + 1, searchParams)}
          className="btn-secondary px-4 py-2"
        >
          التالي
        </Link>
      ) : null}
    </nav>
  );
}
