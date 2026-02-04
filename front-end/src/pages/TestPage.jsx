import { useState, useEffect } from "react";
import { API_BASE_URL } from "@/services/api";

const TestPage = () => {
  const [colleges, setColleges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchColleges = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/colleges`);
        const data = await response.json();
        
        if (data.success) {
          setColleges(data.data);
        } else {
          setError('Failed to fetch colleges');
        }
      } catch (err) {
        setError('Network error: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchColleges();
  }, []);

  if (loading) return <div className="p-8">Loading...</div>;
  if (error) return <div className="p-8 text-red-500">Error: {error}</div>;

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Test Page - Colleges List</h1>
      <div className="space-y-4">
        {colleges.map((college) => (
          <div key={college._id} className="p-4 border rounded-lg">
            <h3 className="font-semibold">{college.name}</h3>
            <p className="text-sm text-gray-600">
              {college.code} • {college.location.city}, {college.location.state}
            </p>
            <p className="text-xs text-gray-500 capitalize">{college.type}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TestPage;
