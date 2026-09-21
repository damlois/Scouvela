import { SearchForm } from '@/components/search/SearchForm';

export default function VendorsPage() {
  return (
    <section className="space-y-4">
      <div>
        <p className="text-sm font-medium text-amber">Placeholder vendor page</p>
        <h1 className="mt-2 text-2xl font-semibold text-teal">Find local vendors</h1>
        <p className="mt-2 text-sm text-charcoal/80">
          Confirm that routing, Tailwind and shared vendor types work. Visual design comes later.
        </p>
      </div>
      <SearchForm mode="vendors" />
    </section>
  );
}
