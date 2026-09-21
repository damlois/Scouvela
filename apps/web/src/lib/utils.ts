export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ');
}

export function formatList(values: string[] | undefined): string {
  if (!values || values.length === 0) {
    return 'Not specified';
  }

  return values.join(', ');
}
