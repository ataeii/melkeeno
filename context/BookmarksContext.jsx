'use client';
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'react-toastify';

const BookmarksContext = createContext();

export function BookmarksProvider({ children }) {
  const { data: session, status } = useSession();
  const [listingTokens, setListingTokens] = useState(new Set());
  const [schoolIds, setSchoolIds] = useState(new Set());
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (status !== 'authenticated') {
      setListingTokens(new Set());
      setSchoolIds(new Set());
      setLoaded(status !== 'loading');
      return;
    }
    fetch('/api/bookmarks/scraped')
      .then((res) => res.json())
      .then((data) => {
        setListingTokens(new Set(data.listings || []));
        setSchoolIds(new Set(data.schools || []));
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, [status]);

  const toggle = useCallback(
    async (type, id) => {
      if (!session?.user) {
        toast.error('برای ذخیره کردن ابتدا وارد شوید');
        return;
      }
      const setFn = type === 'listing' ? setListingTokens : setSchoolIds;
      const key = type === 'listing' ? String(id) : Number(id);

      // optimistic update
      setFn((prev) => {
        const next = new Set(prev);
        next.has(key) ? next.delete(key) : next.add(key);
        return next;
      });

      try {
        const res = await fetch('/api/bookmarks/scraped', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type, id }),
        });
        if (!res.ok) throw new Error('failed');
        const data = await res.json();
        // reconcile with server truth in case of a race
        setFn((prev) => {
          const next = new Set(prev);
          data.isBookmarked ? next.add(key) : next.delete(key);
          return next;
        });
      } catch {
        // revert optimistic update on failure
        setFn((prev) => {
          const next = new Set(prev);
          next.has(key) ? next.delete(key) : next.add(key);
          return next;
        });
        toast.error('خطا در ذخیره کردن');
      }
    },
    [session]
  );

  return (
    <BookmarksContext.Provider
      value={{
        loaded,
        isBookmarked: (type, id) =>
          type === 'listing' ? listingTokens.has(String(id)) : schoolIds.has(Number(id)),
        toggleListing: (token) => toggle('listing', token),
        toggleSchool: (id) => toggle('school', id),
      }}
    >
      {children}
    </BookmarksContext.Provider>
  );
}

export function useBookmarks() {
  return useContext(BookmarksContext);
}
