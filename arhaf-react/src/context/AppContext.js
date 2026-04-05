import { createContext, useContext, useState, useCallback, useRef } from 'react';

const API_URL = "http://127.0.0.1:8000"; 
const AppContext = createContext();

export function AppProvider({ children }) {
  const [user, setUser]         = useState(null);
  const [page, setPage]         = useState('home');
  const [kids, setKids]         = useState([]);
  const [analyses, setAnalyses] = useState([]);
  const [toast, setToast]       = useState(null);
  const toastRef = useRef(null);

  const navigate = useCallback((p) => {
    setPage(p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const showToast = useCallback((msg, type = 'tok') => {
    setToast({ msg, type });
    if (toastRef.current) clearTimeout(toastRef.current);
    toastRef.current = setTimeout(() => setToast(null), 3000);
  }, []);

  const login = (userData) => { 
    setUser(userData); 
    if(userData.access) localStorage.setItem('access_token', userData.access);
  };
  
  const logout = () => { 
    setUser(null); 
    localStorage.removeItem('access_token');
    navigate('home'); 
  };

  const addKid = (kid) => {
    const newKid = { ...kid, id: kid.id || Date.now(), parent: user?.email || 'guest' };
    setKids(prev => [...prev, newKid]);
    return newKid;
  };

  const addAnalysis = async (audioBlob, childId) => {
    const formData = new FormData();
    formData.append('audio_file', audioBlob);
    formData.append('child', childId);

    // السطر السحري الناقص (تعريف التوكن داخل الدالة)
    const token = localStorage.getItem('access_token'); 

    try {
      const response = await fetch(`${API_URL}/api/upload-voice/`, { 
        method: "POST",
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Server Error");
      }

      const data = await response.json();
      const selectedChild = kids.find(k => k.id === parseInt(childId));

      const newAnalysis = {
        id: data.id || Date.now(),
        childName: selectedChild ? selectedChild.name : 'طفل غير معروف',
        date: new Date().toLocaleDateString(),
        prediction_result: data.prediction_result, 
        confidence_score: data.confidence_score, 
      };

      setAnalyses(prev => [newAnalysis, ...prev]);
      showToast("تم التحليل بنجاح", "tok");
      return newAnalysis;

    } catch (error) {
      showToast("خطأ في الاتصال بالخادم", "err");
      return null;
    }
  };

  return (
    <AppContext.Provider value={{
      user, login, logout, page, navigate,
      kids, addKid, analyses, addAnalysis, toast, showToast,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);