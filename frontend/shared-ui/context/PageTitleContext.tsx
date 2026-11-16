import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

const PageTitleContext = createContext<{
  title: string;
  setTitle: (t: string) => void;
}>({ title: '', setTitle: () => undefined });

export function PageTitleProvider({ children, defaultTitle }: { children: ReactNode; defaultTitle: string }) {
  const [title, setTitle] = useState(defaultTitle);
  return (
    <PageTitleContext.Provider value={{ title, setTitle }}>{children}</PageTitleContext.Provider>
  );
}

export function usePageTitle() {
  return useContext(PageTitleContext);
}

export function PageTitleSync({ title }: { title: string }) {
  const { setTitle } = usePageTitle();
  useEffect(() => {
    setTitle(title);
  }, [title, setTitle]);
  return null;
}
