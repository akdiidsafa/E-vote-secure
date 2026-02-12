import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

export const formatDate = (date, formatStr = 'dd MMMM yyyy, HH:mm') => {
  if (!date) return '';
  const parsedDate = typeof date === 'string' ? parseISO(date) : date;
  return format(parsedDate, formatStr, { locale: fr });
};