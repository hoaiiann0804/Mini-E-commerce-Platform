import React from "react";
import { useAuth } from "@/hooks/useAuth";

const AdminDebug: React.FC = () => {
  const { user, token } = useAuth();

  const handleTestAPI = async () => {
    const storedToken = localStorage.getItem("token");
    //console.log('Stored token:', storedToken);
    //console.log('Auth token:', token);
    //console.log('User:', user);

    try {
      const response = await fetch("/api/admin/dashboard", {
        headers: {
          Authorization: `Bearer ${storedToken}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      //console.log('API Response:', data);
    } catch (error) {
      console.error("API Error:", error);
    }
  };

  return (
    <div className="p-4 bg-yellow-100 border border-yellow-300 rounded-lg mb-4">
      <h3 className="font-bold text-yellow-800 mb-2">Debug Info</h3>
      <div className="text-sm text-yellow-700 space-y-1">
        <p>User: {user?.email}</p>
        <p>Role: {user?.role}</p>
        <p>Token exists: {token ? "Yes" : "No"}</p>
        <p>
          LocalStorage token: {localStorage.getItem("token") ? "Yes" : "No"}
        </p>
        <button
          onClick={handleTestAPI}
          className="mt-2 px-3 py-1 bg-yellow-600 text-white rounded text-xs"
        >
          Test API Call
        </button>
      </div>
    </div>
  );
};

export default AdminDebug;
