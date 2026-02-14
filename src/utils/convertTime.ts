export function convertDate(dateString: string | null | undefined): {
  dateOnly: string;
  dateTime: string;
} {
  if (!dateString) {
    return {
      dateOnly: '',
      dateTime: '',
    };
  }
  const date = new Date(dateString);
  const day = date.getDate();
  const month = date.toLocaleString('default', { month: 'long' });
  const year = date.getFullYear();
  const hour = date.getHours() % 12 || 12;
  const minute = date.getMinutes();
  const ampm = date.getHours() >= 12 ? 'PM' : 'AM';

  return {
    dateOnly: `${day} ${month} ${year}`,
    dateTime: `${day} ${month} ${year} ${hour}:${minute.toString().padStart(2, '0')} ${ampm}`,
  };
}
