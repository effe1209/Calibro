import { useEffect, useState } from 'react';

export function useObjectUrl(blob) {
  const [objectUrl, setObjectUrl] = useState(null);

  useEffect(() => {
    if (!blob) {
      setObjectUrl(null);
      return undefined;
    }

    const nextObjectUrl = URL.createObjectURL(blob);
    setObjectUrl(nextObjectUrl);
    return () => URL.revokeObjectURL(nextObjectUrl);
  }, [blob]);

  return objectUrl;
}
