import { useEffect, useState } from 'react';
import axiosClient from '../../api/axiosClient';
import Spinner from '../../components/ui/Spinner';
import Toast, { useToast } from '../../components/ui/Toast';
import { useConfirm } from '../../components/ui/ConfirmModal';

const ROLE_TABS = [
  { key: 'ALL', label: '전체' },
  { key: 'BUYER', label: '구매자' },
  { key: 'SELLER', label: '판매자' },
  { key: 'ADMIN', label: '관리자' },
];

const ROLE_STYLES = {
  ADMIN: 'bg-gray-800 text-white',
  SELLER: 'bg-purple-100 text-purple-700',
  BUYER: 'bg-blue-100 text-blue-700',
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [pendingId, setPendingId] = useState(null);
  const { toast, show, hide } = useToast();
  const { confirm, ConfirmModal } = useConfirm();

  const fetchUsers = () => {
    setLoading(true);
    axiosClient.get('/admin/users')
      .then((res) => setUsers(res.data.data || []))
      .catch(() => show('회원 목록을 불러오지 못했습니다.', 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleRoleChange = async (user, newRole) => {
    if (user.role === newRole) return;
    if (user.role === 'ADMIN' || newRole === 'ADMIN') {
      return show('관리자 역할은 변경할 수 없습니다.', 'error');
    }
    const ok = await confirm(
      `${user.username}님의 역할을 ${newRole === 'SELLER' ? '판매자' : '구매자'}로 변경하시겠습니까?`,
      newRole === 'BUYER' ? '판매자 권한이 회수됩니다.' : '',
    );
    if (!ok) return;
    setPendingId(user.id);
    try {
      const res = await axiosClient.put(`/admin/users/${user.id}`, { role: newRole });
      setUsers((prev) => prev.map((u) => u.id === user.id ? res.data.data : u));
      show('역할이 변경되었습니다.', 'success');
    } catch (err) {
      show(err.response?.data?.message || '역할 변경에 실패했습니다.', 'error');
    } finally {
      setPendingId(null);
    }
  };

  const handleToggleActive = async (user) => {
    if (user.role === 'ADMIN') {
      return show('관리자 계정은 정지할 수 없습니다.', 'error');
    }
    const nextActive = !(user.active ?? true);
    const ok = await confirm(
      nextActive
        ? `${user.username}님의 계정을 활성화하시겠습니까?`
        : `${user.username}님의 계정을 정지하시겠습니까?`,
      nextActive ? '해당 회원이 다시 로그인할 수 있게 됩니다.' : '해당 회원은 로그인할 수 없게 됩니다.',
    );
    if (!ok) return;
    setPendingId(user.id);
    try {
      const res = await axiosClient.put(`/admin/users/${user.id}`, { active: nextActive });
      setUsers((prev) => prev.map((u) => u.id === user.id ? res.data.data : u));
      show(nextActive ? '계정이 활성화되었습니다.' : '계정이 정지되었습니다.', 'success');
    } catch (err) {
      show(err.response?.data?.message || '처리에 실패했습니다.', 'error');
    } finally {
      setPendingId(null);
    }
  };

  const keyword = search.trim().toLowerCase();
  const filteredUsers = users
    .filter((u) => roleFilter === 'ALL' || u.role === roleFilter)
    .filter((u) => !keyword
      || (u.username || '').toLowerCase().includes(keyword)
      || (u.email || '').toLowerCase().includes(keyword));

  const roleCounts = users.reduce((acc, u) => {
    acc[u.role] = (acc[u.role] || 0) + 1;
    return acc;
  }, {});

  return (
    <div>
      <ConfirmModal />
      <Toast toast={toast} onClose={hide} />

      <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6">회원 관리</h1>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <div className="rounded-xl p-4 bg-indigo-50 text-indigo-700">
          <div className="text-2xl font-bold">{users.length}</div>
          <div className="text-xs mt-1 opacity-80">전체 회원</div>
        </div>
        <div className="rounded-xl p-4 bg-blue-50 text-blue-700">
          <div className="text-2xl font-bold">{roleCounts.BUYER || 0}</div>
          <div className="text-xs mt-1 opacity-80">구매자</div>
        </div>
        <div className="rounded-xl p-4 bg-purple-50 text-purple-700">
          <div className="text-2xl font-bold">{roleCounts.SELLER || 0}</div>
          <div className="text-xs mt-1 opacity-80">판매자</div>
        </div>
        <div className="rounded-xl p-4 bg-gray-100 text-gray-700">
          <div className="text-2xl font-bold">{roleCounts.ADMIN || 0}</div>
          <div className="text-xs mt-1 opacity-80">관리자</div>
        </div>
      </div>

      {/* 역할 탭 */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1 scrollbar-none">
        {ROLE_TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setRoleFilter(t.key)}
            className={`px-3.5 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              roleFilter === t.key
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* 검색 */}
      <div className="mb-4">
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2">
          <span className="text-gray-400 text-sm">🔍</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="아이디 / 이메일 검색"
            className="flex-1 bg-transparent text-sm text-gray-700 outline-none"
          />
          {search && (
            <button onClick={() => setSearch('')} className="text-gray-400 hover:text-gray-600 text-xs">
              취소
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : filteredUsers.length === 0 ? (
        <div className="text-center py-16 text-gray-400 bg-white rounded-xl border border-gray-100">
          조회된 회원이 없습니다.
        </div>
      ) : (
        <>
          {/* 데스크탑: 테이블 */}
          <div className="hidden sm:block bg-white rounded-xl border border-gray-100 overflow-x-auto">
            <table className="w-full text-sm min-w-[720px]">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                <tr>
                  <th className="px-4 py-3 text-left">ID</th>
                  <th className="px-4 py-3 text-left">아이디</th>
                  <th className="px-4 py-3 text-left">이메일</th>
                  <th className="px-4 py-3 text-center">역할</th>
                  <th className="px-4 py-3 text-center">상태</th>
                  <th className="px-4 py-3 text-center">가입일</th>
                  <th className="px-4 py-3 text-center">액션</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredUsers.map((u) => {
                  const active = u.active ?? true;
                  const isAdmin = u.role === 'ADMIN';
                  const busy = pendingId === u.id;
                  return (
                    <tr key={u.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-400">{u.id}</td>
                      <td className="px-4 py-3 font-medium text-gray-800">{u.username}</td>
                      <td className="px-4 py-3 text-gray-500">{u.email}</td>
                      <td className="px-4 py-3 text-center">
                        {isAdmin ? (
                          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${ROLE_STYLES.ADMIN}`}>
                            ADMIN
                          </span>
                        ) : (
                          <select
                            value={u.role}
                            onChange={(e) => handleRoleChange(u, e.target.value)}
                            disabled={busy}
                            className="px-2 py-1 text-xs font-semibold rounded-md border border-gray-200 bg-white disabled:opacity-50"
                          >
                            <option value="BUYER">BUYER</option>
                            <option value="SELLER">SELLER</option>
                          </select>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
                          active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {active ? '활성' : '정지'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-gray-400 text-xs">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString('ko-KR') : '-'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {isAdmin ? (
                          <span className="text-xs text-gray-400">-</span>
                        ) : (
                          <button
                            onClick={() => handleToggleActive(u)}
                            disabled={busy}
                            className={`px-2.5 py-1 text-xs font-medium rounded transition-colors disabled:opacity-50 ${
                              active
                                ? 'border border-red-200 text-red-600 hover:bg-red-50'
                                : 'bg-green-50 text-green-700 hover:bg-green-100'
                            }`}
                          >
                            {active ? '계정 정지' : '활성화'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* 모바일: 카드 리스트 */}
          <div className="sm:hidden flex flex-col gap-2">
            {filteredUsers.map((u) => {
              const active = u.active ?? true;
              const isAdmin = u.role === 'ADMIN';
              const busy = pendingId === u.id;
              return (
                <div key={u.id} className="bg-white rounded-xl border border-gray-100 p-3">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{u.username}</p>
                      <p className="text-xs text-gray-400 truncate">{u.email}</p>
                    </div>
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold flex-shrink-0 ${
                      active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {active ? '활성' : '정지'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {isAdmin ? (
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${ROLE_STYLES.ADMIN}`}>ADMIN</span>
                    ) : (
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u, e.target.value)}
                        disabled={busy}
                        className="px-2 py-1 text-xs font-semibold rounded-md border border-gray-200 bg-white disabled:opacity-50"
                      >
                        <option value="BUYER">BUYER</option>
                        <option value="SELLER">SELLER</option>
                      </select>
                    )}
                    {!isAdmin && (
                      <button
                        onClick={() => handleToggleActive(u)}
                        disabled={busy}
                        className={`ml-auto px-2.5 py-1 text-xs font-medium rounded transition-colors disabled:opacity-50 ${
                          active
                            ? 'border border-red-200 text-red-600 hover:bg-red-50'
                            : 'bg-green-50 text-green-700 hover:bg-green-100'
                        }`}
                      >
                        {active ? '계정 정지' : '활성화'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      <p className="mt-3 text-xs text-gray-400">{filteredUsers.length}명 표시 중</p>
    </div>
  );
}
