import React, { useState, useEffect } from "react";
import BookPile from "./components/BookPile.jsx";
import LongPressCard from "./components/LongPressCard.jsx";
import AuthForm from "./components/AuthForm.jsx";
import { useAuth } from "./contexts/AuthContext.jsx";
import {
  addBook,
  updateBook,
  deleteBook,
  markBookAsRead,
  subscribeToBooks,
} from "./firestore.js";
function BookApp() {
  const { user, logout } = useAuth();
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [pages, setPages] = useState("");
  const [books, setBooks] = useState([]);
  const [editingBook, setEditingBook] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editAuthor, setEditAuthor] = useState("");
  const [editPages, setEditPages] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterAuthor, setFilterAuthor] = useState("");
  const [filterStatus, setFilterStatus] = useState("all"); // 'all', 'unread', 'read'
  const [sortBy, setSortBy] = useState("addedAt"); // 'addedAt', 'title', 'author', 'finishedAt'
  const [sortOrder, setSortOrder] = useState("desc"); // 'asc', 'desc'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Firestoreから本のデータをリアルタイムで取得
  useEffect(() => {
    if (!user) {
      setBooks([]);
      setLoading(false);
      return;
    }

    const unsubscribe = subscribeToBooks(user.uid, (booksData) => {
      setBooks(booksData);
      setLoading(false);
      setError(null);
    });

    return () => unsubscribe();
  }, [user]);
  const filterBooks = (books) => {
    let filtered = books;

    // 検索フィルター
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (book) =>
          book.title.toLowerCase().includes(query) ||
          book.author.toLowerCase().includes(query)
      );
    }

    // 著者フィルター
    if (filterAuthor.trim()) {
      const author = filterAuthor.toLowerCase();
      filtered = filtered.filter((book) =>
        book.author.toLowerCase().includes(author)
      );
    }

    return filtered;
  };

  const getFilteredBooks = () => {
    let filtered = filterBooks(books);

    // 状態フィルター
    if (filterStatus === "unread") {
      filtered = filtered.filter((b) => !b.read);
    } else if (filterStatus === "read") {
      filtered = filtered.filter((b) => b.read);
    }

    return filtered;
  };

  const sortBooks = (books) => {
    return books.sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case "title":
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case "author":
          aValue = a.author.toLowerCase();
          bValue = b.author.toLowerCase();
          break;
        case "finishedAt":
          aValue = a.finishedAt || 0;
          bValue = b.finishedAt || 0;
          break;
        default: // addedAt
          aValue = a.addedAt;
          bValue = b.addedAt;
      }

      if (sortBy === "title" || sortBy === "author") {
        return sortOrder === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      } else {
        return sortOrder === "asc" ? aValue - bValue : bValue - aValue;
      }
    });
  };

  const filteredBooks = getFilteredBooks();
  const unread = sortBooks(filteredBooks.filter((b) => !b.read));
  const read = sortBooks(filteredBooks.filter((b) => b.read));

  // 著者リストを取得
  const authors = [
    ...new Set(books.map((b) => b.author).filter((a) => a.trim())),
  ].sort();
  const handleAddBook = async () => {
    if (!title.trim() || !user) return;

    try {
      setError(null);
      const bookData = {
        title: title.trim(),
        author: author.trim(),
        pages: pages.trim() ? parseInt(pages) || 0 : 0,
      };

      await addBook(user.uid, bookData);
      setTitle("");
      setAuthor("");
      setPages("");
    } catch (error) {
      setError("本の追加に失敗しました");
      console.error(error);
    }
  };
  const handleMarkRead = async (book) => {
    if (!user) return;

    try {
      setError(null);
      await markBookAsRead(user.uid, book.id);
    } catch (error) {
      setError("読了マークに失敗しました");
      console.error(error);
    }
  };

  const handleDeleteBook = async (bookId) => {
    if (!user) return;

    try {
      setError(null);
      await deleteBook(user.uid, bookId);
    } catch (error) {
      setError("本の削除に失敗しました");
      console.error(error);
    }
  };
  const startEdit = (book) => {
    setEditingBook(book);
    setEditTitle(book.title);
    setEditAuthor(book.author);
    setEditPages(book.pages || "");
  };
  const handleSaveEdit = async () => {
    if (!editTitle.trim() || !user) return;

    try {
      setError(null);
      const bookData = {
        title: editTitle.trim(),
        author: editAuthor.trim(),
        pages: editPages.trim() ? parseInt(editPages) || 0 : 0,
      };

      await updateBook(user.uid, editingBook.id, bookData);
      setEditingBook(null);
      setEditTitle("");
      setEditAuthor("");
      setEditPages("");
    } catch (error) {
      setError("本の更新に失敗しました");
      console.error(error);
    }
  };
  const cancelEdit = () => {
    setEditingBook(null);
    setEditTitle("");
    setEditAuthor("");
    setEditPages("");
  };
  return (
    <div
      className="min-h-screen"
      style={{
        background: `
            repeating-linear-gradient(
              0deg,
              transparent,
              transparent 12px,
              rgba(255, 255, 255, 0.015) 12px,
              rgba(255, 255, 255, 0.015) 24px
            ),
            linear-gradient(135deg, #1a4d3a 0%, #0f3d2a 30%, #1a4d3a 70%, #0f3d2a 100%),
            radial-gradient(ellipse at top, rgba(255, 255, 255, 0.005) 0%, transparent 50%)
          `,
        color: "#374151",
      }}
    >
      <header
        className="sticky top-0 z-10 backdrop-blur border-b"
        style={{
          background: "linear-gradient(180deg, #1d2a3a 0%, #162430 100%)",
          borderBottomColor: "#1d2a3a",
          boxShadow:
            "0 8px 32px -8px rgba(0, 0, 0, 0.4), 0 4px 16px -4px rgba(0, 0, 0, 0.2)",
          backdropFilter: "blur(12px)",
        }}
      >
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <h1 className="text-lg font-semibold text-white">Book‑Replay</h1>
              <div className="flex-1 max-w-md">
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="本を検索..."
                  className="w-full rounded-xl px-3 py-2 outline-none text-sm text-white"
                  style={{ backgroundColor: "rgba(255, 255, 255, 0.2)" }}
                />
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-white">{user?.email}</span>
                <button
                  onClick={logout}
                  className="px-3 py-1 rounded-lg text-sm text-white hover:bg-red-600 transition-colors"
                  style={{ backgroundColor: "rgba(239, 68, 68, 0.8)" }}
                >
                  ログアウト
                </button>
              </div>
            </div>
            <div className="flex gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <label
                  className="text-sm"
                  style={{ color: "rgba(255, 255, 255, 0.7)" }}
                >
                  状態:
                </label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="rounded-lg px-3 py-1 text-sm outline-none text-white"
                  style={{ backgroundColor: "rgba(255, 255, 255, 0.2)" }}
                >
                  <option
                    value="all"
                    style={{ backgroundColor: "#1e40af", color: "white" }}
                  >
                    すべて
                  </option>
                  <option
                    value="unread"
                    style={{ backgroundColor: "#1e40af", color: "white" }}
                  >
                    未読のみ
                  </option>
                  <option
                    value="read"
                    style={{ backgroundColor: "#1e40af", color: "white" }}
                  >
                    読了のみ
                  </option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label
                  className="text-sm"
                  style={{ color: "rgba(255, 255, 255, 0.7)" }}
                >
                  著者:
                </label>
                <select
                  value={filterAuthor}
                  onChange={(e) => setFilterAuthor(e.target.value)}
                  className="rounded-lg px-3 py-1 text-sm outline-none min-w-32 text-white"
                  style={{ backgroundColor: "rgba(255, 255, 255, 0.2)" }}
                >
                  <option
                    value=""
                    style={{ backgroundColor: "#1e40af", color: "white" }}
                  >
                    すべて
                  </option>
                  {authors.map((author) => (
                    <option
                      key={author}
                      value={author}
                      style={{ backgroundColor: "#1e40af", color: "white" }}
                    >
                      {author}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label
                  className="text-sm"
                  style={{ color: "rgba(255, 255, 255, 0.7)" }}
                >
                  並び順:
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="rounded-lg px-3 py-1 text-sm outline-none text-white"
                  style={{ backgroundColor: "rgba(255, 255, 255, 0.2)" }}
                >
                  <option
                    value="addedAt"
                    style={{ backgroundColor: "#1e40af", color: "white" }}
                  >
                    追加日
                  </option>
                  <option
                    value="title"
                    style={{ backgroundColor: "#1e40af", color: "white" }}
                  >
                    タイトル
                  </option>
                  <option
                    value="author"
                    style={{ backgroundColor: "#1e40af", color: "white" }}
                  >
                    著者
                  </option>
                  <option
                    value="finishedAt"
                    style={{ backgroundColor: "#1e40af", color: "white" }}
                  >
                    読了日
                  </option>
                </select>
                <button
                  onClick={() =>
                    setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                  }
                  className="px-2 py-1 rounded text-sm transition-colors text-white"
                  style={{ backgroundColor: "rgba(255, 255, 255, 0.2)" }}
                  onMouseEnter={(e) =>
                    (e.target.style.backgroundColor =
                      "rgba(255, 255, 255, 0.3)")
                  }
                  onMouseLeave={(e) =>
                    (e.target.style.backgroundColor =
                      "rgba(255, 255, 255, 0.2)")
                  }
                  title={sortOrder === "asc" ? "降順に変更" : "昇順に変更"}
                >
                  {sortOrder === "asc" ? "↑" : "↓"}
                </button>
              </div>
              {(searchQuery ||
                filterAuthor ||
                filterStatus !== "all" ||
                sortBy !== "addedAt" ||
                sortOrder !== "desc") && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setFilterAuthor("");
                    setFilterStatus("all");
                    setSortBy("addedAt");
                    setSortOrder("desc");
                  }}
                  className="px-3 py-1 rounded-lg text-sm transition-colors text-white"
                  style={{ backgroundColor: "rgba(255, 255, 255, 0.2)" }}
                  onMouseEnter={(e) =>
                    (e.target.style.backgroundColor =
                      "rgba(255, 255, 255, 0.3)")
                  }
                  onMouseLeave={(e) =>
                    (e.target.style.backgroundColor =
                      "rgba(255, 255, 255, 0.2)")
                  }
                >
                  クリア
                </button>
              )}
            </div>
          </div>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* エラー表示 */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* ローディング表示 */}
        {loading ? (
          <div className="text-center py-8">
            <div className="text-white">データを読み込み中...</div>
          </div>
        ) : (
          <>
            <BookPile count={unread.length} />
            <section
              className="rounded-2xl border p-4"
              style={{
                borderColor: "#d1d5db",
                backgroundColor: "#fef3c7",
                boxShadow:
                  "0 20px 40px -12px rgba(0, 0, 0, 0.15), 0 8px 16px -4px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2)",
              }}
            >
              <h2
                className="text-sm uppercase tracking-wider mb-3 flex items-center gap-2"
                style={{ color: "#374151" }}
              >
                <span className="text-lg">📚</span>
                新しい本を追加
              </h2>
              <div className="flex gap-2">
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleAddBook();
                    }
                  }}
                  placeholder="本のタイトル"
                  className="flex-1 rounded-xl px-3 py-2 outline-none"
                  style={{ backgroundColor: "white", borderColor: "#e5e7eb" }}
                />
                <input
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleAddBook();
                    }
                  }}
                  placeholder="著者名"
                  className="w-32 rounded-xl px-3 py-2 outline-none"
                  style={{ backgroundColor: "white", borderColor: "#e5e7eb" }}
                />
                <input
                  value={pages}
                  onChange={(e) => setPages(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleAddBook();
                    }
                  }}
                  placeholder="ページ数"
                  type="number"
                  min="0"
                  className="w-24 rounded-xl px-3 py-2 outline-none"
                  style={{ backgroundColor: "white", borderColor: "#e5e7eb" }}
                />
                <button
                  onClick={handleAddBook}
                  className="px-4 py-2 rounded-xl text-white font-semibold"
                  style={{ backgroundColor: "#f97316" }}
                >
                  追加
                </button>
              </div>
              <p className="text-xs mt-2" style={{ color: "#6b7280" }}>
                ヒント:
                追加後、カードを長押し（約0.8秒）すると「読了」になります。
              </p>
            </section>
            <section>
              <h2
                className="text-sm uppercase tracking-wider mb-2 flex items-center gap-2"
                style={{ color: "#f3f4f6" }}
              >
                <span className="text-lg">📚</span>
                未読(積読)
                {searchQuery && (
                  <span className="ml-2 text-xs">({unread.length}件)</span>
                )}
              </h2>
              <div>
                {unread.map((b, i) => (
                  <LongPressCard
                    key={b.id}
                    index={i}
                    book={b}
                    onLong={() => handleMarkRead(b)}
                    onDelete={() => handleDeleteBook(b.id)}
                    onEdit={() => startEdit(b)}
                  />
                ))}
                {unread.length === 0 && !searchQuery && (
                  <div
                    className="p-8 text-center rounded-2xl"
                    style={{
                      color: "#6b7280",
                      borderColor: "#d1d5db",
                      backgroundColor: "#fef3c7",
                      boxShadow: "0 4px 15px -3px rgba(0, 0, 0, 0.1)",
                    }}
                  >
                    未読はありません。上のフォームから追加してください。
                  </div>
                )}
                {unread.length === 0 && searchQuery && (
                  <div
                    className="p-8 text-center rounded-2xl"
                    style={{
                      color: "#6b7280",
                      borderColor: "#d1d5db",
                      backgroundColor: "#fef3c7",
                      boxShadow: "0 4px 15px -3px rgba(0, 0, 0, 0.1)",
                    }}
                  >
                    検索条件に一致する未読の本はありません。
                  </div>
                )}
              </div>
            </section>
            <section>
              <h2
                className="text-sm uppercase tracking-wider mb-2 flex items-center gap-2"
                style={{ color: "#f3f4f6" }}
              >
                <span className="text-lg">✅</span>
                読了
                {searchQuery && (
                  <span className="ml-2 text-xs">({read.length}件)</span>
                )}
              </h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {read.map((b) => (
                  <div
                    key={b.id}
                    className="rounded-2xl p-4 relative group"
                    style={{
                      borderColor: "#d1d5db",
                      backgroundColor: "#fef3c7",
                      boxShadow: "0 4px 15px -3px rgba(0, 0, 0, 0.1)",
                    }}
                  >
                    <div className="absolute top-2 right-2 flex gap-1">
                      <button
                        onClick={() => startEdit(b)}
                        className="w-6 h-6 rounded-full bg-blue-500/20 hover:bg-blue-500/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        title="編集"
                      >
                        <span className="text-blue-400 text-xs">✏</span>
                      </button>
                      <button
                        onClick={() => handleDeleteBook(b.id)}
                        className="w-6 h-6 rounded-full bg-red-500/20 hover:bg-red-500/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        title="削除"
                      >
                        <span className="text-red-400 text-xs">×</span>
                      </button>
                    </div>
                    <div className="font-semibold" style={{ color: "#374151" }}>
                      {b.title}
                    </div>
                    <div className="text-sm" style={{ color: "#6b7280" }}>
                      {b.author}
                    </div>
                    {b.pages > 0 && (
                      <div
                        className="text-xs mt-1"
                        style={{ color: "#9ca3af" }}
                      >
                        {b.pages}ページ
                      </div>
                    )}
                    <div className="text-xs mt-1" style={{ color: "#9ca3af" }}>
                      {b.finishedAt
                        ? new Date(b.finishedAt).toLocaleString()
                        : ""}
                    </div>
                  </div>
                ))}
                {read.length === 0 && !searchQuery && (
                  <div
                    className="p-6 rounded-2xl"
                    style={{
                      color: "#6b7280",
                      borderColor: "#d1d5db",
                      backgroundColor: "#fef3c7",
                      boxShadow: "0 4px 15px -3px rgba(0, 0, 0, 0.1)",
                    }}
                  >
                    まだ読了はありません。
                  </div>
                )}
                {read.length === 0 && searchQuery && (
                  <div
                    className="p-6 rounded-2xl"
                    style={{
                      color: "#6b7280",
                      borderColor: "#d1d5db",
                      backgroundColor: "#fef3c7",
                      boxShadow: "0 4px 15px -3px rgba(0, 0, 0, 0.1)",
                    }}
                  >
                    検索条件に一致する読了の本はありません。
                  </div>
                )}
              </div>
            </section>
          </>
        )}
      </main>

      {/* 編集モーダル */}
      {editingBook && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
            <h3
              className="text-lg font-semibold mb-4"
              style={{ color: "#374151" }}
            >
              本を編集
            </h3>
            <div className="space-y-4">
              <div>
                <label
                  className="block text-sm mb-2"
                  style={{ color: "#6b7280" }}
                >
                  タイトル
                </label>
                <input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full rounded-xl px-3 py-2 outline-none"
                  style={{ backgroundColor: "#f3f4f6", borderColor: "#e5e7eb" }}
                  placeholder="タイトル"
                />
              </div>
              <div>
                <label
                  className="block text-sm mb-2"
                  style={{ color: "#6b7280" }}
                >
                  著者
                </label>
                <input
                  value={editAuthor}
                  onChange={(e) => setEditAuthor(e.target.value)}
                  className="w-full rounded-xl px-3 py-2 outline-none"
                  style={{ backgroundColor: "#f3f4f6", borderColor: "#e5e7eb" }}
                  placeholder="著者（任意）"
                />
              </div>
              <div>
                <label
                  className="block text-sm mb-2"
                  style={{ color: "#6b7280" }}
                >
                  ページ数
                </label>
                <input
                  value={editPages}
                  onChange={(e) => setEditPages(e.target.value)}
                  type="number"
                  min="0"
                  className="w-full rounded-xl px-3 py-2 outline-none"
                  style={{ backgroundColor: "#f3f4f6", borderColor: "#e5e7eb" }}
                  placeholder="ページ数（任意）"
                />
              </div>
              <div className="flex gap-2 pt-4">
                <button
                  onClick={handleSaveEdit}
                  className="flex-1 px-4 py-2 rounded-xl text-white font-semibold"
                  style={{ backgroundColor: "#f97316" }}
                >
                  保存
                </button>
                <button
                  onClick={cancelEdit}
                  className="flex-1 px-4 py-2 rounded-xl text-white font-semibold"
                  style={{ backgroundColor: "#6b7280" }}
                >
                  キャンセル
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// メインのAppコンポーネント
export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{
          background: `
          repeating-linear-gradient(
            0deg,
            transparent,
            transparent 12px,
            rgba(255, 255, 255, 0.015) 12px,
            rgba(255, 255, 255, 0.015) 24px
          ),
          linear-gradient(135deg, #1a4d3a 0%, #0f3d2a 30%, #1a4d3a 70%, #0f3d2a 100%),
          radial-gradient(ellipse at top, rgba(255, 255, 255, 0.005) 0%, transparent 50%)
        `,
        }}
      >
        <div className="text-white text-lg">読み込み中...</div>
      </div>
    );
  }

  return user ? <BookApp /> : <AuthForm />;
}
