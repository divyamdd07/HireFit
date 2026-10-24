import { useEffect, useState } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

export default function AdminUsersPage() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState([]);
  const [role, setRole] = useState("");
  const [searchText, setSearchText] = useState(""); // input mein jo likha
  const [search, setSearch] = useState(""); // jo actually bheja gaya
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    api.get("/admin/users", { params: { role: role || undefined, search: search || undefined } })
      .then((res) => setUsers(res.data.users))
      .catch((err) => setError(err.response?.data?.message || "Could not load users."))
      .finally(() => setLoading(false));
  }, [role, search]);

  const update = async (target, changes) => {
    setError("");
    try {
      const res = await api.patch(`/admin/users/${target._id}`, changes);
      setUsers(users.map((u) => (u._id === target._id ? res.data.user : u)));
    } catch (err) {
      setError(err.response?.data?.message || "Could not update user.");
    }
  };

  const toggleBlock = (target) => {
    const action = target.isBlocked ? "unblock" : "block";
    if (window.confirm(`Do you want to ${action} ${target.name}?`)) {
      update(target, { isBlocked: !target.isBlocked });
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(searchText.trim());
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-4">
      <h1 className="text-3xl font-bold">Users</h1>

      <div className="flex flex-wrap gap-3">
        <form onSubmit={handleSearch} className="flex gap-2">
          <input value={searchText} onChange={(e) => setSearchText(e.target.value)}
            placeholder="Search name or email" className="border rounded-lg p-2" />
          <button className="px-4 py-2 border rounded-lg hover:bg-gray-50">Search</button>
        </form>
        <select value={role} onChange={(e) => setRole(e.target.value)} className="border rounded-lg p-2">
          <option value="">All roles</option>
          <option value="candidate">Candidates</option>
          <option value="recruiter">Recruiters</option>
          <option value="admin">Admins</option>
        </select>
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}
      {loading && <p>Loading...</p>}
      {!loading && users.length === 0 && <p className="text-gray-400">No users found.</p>}

      {users.length > 0 && (
        <div className="bg-white rounded-xl shadow overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 text-left">
              <tr>
                <th className="p-3">User</th>
                <th className="p-3">Role</th>
                <th className="p-3">Joined</th>
                <th className="p-3">Status</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const locked = u.role === "admin" || u._id === me.id; // in par action nahi
                return (
                  <tr key={u._id} className="border-t">
                    <td className="p-3">
                      <div className="font-medium">{u.name}</div>
                      <div className="text-gray-500">{u.email}</div>
                    </td>
                    <td className="p-3">
                      {locked ? (
                        <span className="capitalize">{u.role}</span>
                      ) : (
                        <select value={u.role} onChange={(e) => update(u, { role: e.target.value })}
                          className="border rounded p-1">
                          <option value="candidate">candidate</option>
                          <option value="recruiter">recruiter</option>
                        </select>
                      )}
                    </td>
                    <td className="p-3">{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        u.isBlocked ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
                      }`}>
                        {u.isBlocked ? "Blocked" : "Active"}
                      </span>
                    </td>
                    <td className="p-3">
                      {!locked && (
                        <button onClick={() => toggleBlock(u)}
                          className={u.isBlocked ? "text-green-700 hover:underline" : "text-red-600 hover:underline"}>
                          {u.isBlocked ? "Unblock" : "Block"}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}