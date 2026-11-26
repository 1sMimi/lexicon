import type { Wordbook } from './db';

export const currentWordbookKey = 'current-wordbook';
const order = ['frequency','cet4','cet6','toefl','ielts','gre'];

export function orderWordbooks(books: Wordbook[]) {
  const rank = (id: string) => { const index = order.indexOf(id); return index < 0 ? order.length : index; };
  return [...books].sort((a,b)=>rank(a.id)-rank(b.id) || a.name.localeCompare(b.name));
}

export function currentWordbook(books: Wordbook[], id: unknown) {
  return books.find(book=>book.id===id) ?? books.find(book=>book.id==='frequency') ?? books[0];
}
