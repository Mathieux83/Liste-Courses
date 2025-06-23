import NProgress from 'nprogress';
import 'nprogress/nprogress.css';
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function usePageLoader() {
  const location = useLocation();
  useEffect(() => {
    NProgress.start();
    return () => {
      NProgress.done();
    };
  }, [location.pathname]);
}
