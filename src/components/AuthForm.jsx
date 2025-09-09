import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext.jsx";

export default function AuthForm() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login, signup } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isLogin && password !== confirmPassword) {
      setError("パスワードが一致しません");
      return;
    }

    try {
      setError("");
      setLoading(true);

      if (isLogin) {
        await login(email, password);
      } else {
        await signup(email, password);
      }
    } catch (error) {
      setError(getErrorMessage(error.code));
    } finally {
      setLoading(false);
    }
  };

  const getErrorMessage = (errorCode) => {
    switch (errorCode) {
      case "auth/user-not-found":
        return "ユーザーが見つかりません";
      case "auth/wrong-password":
        return "パスワードが間違っています";
      case "auth/email-already-in-use":
        return "このメールアドレスは既に使用されています";
      case "auth/weak-password":
        return "パスワードは6文字以上にしてください";
      case "auth/invalid-email":
        return "メールアドレスの形式が正しくありません";
      default:
        return "エラーが発生しました";
    }
  };

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
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              📚 Book‑Replay
            </h1>
            <p className="text-gray-600">
              {isLogin
                ? "ログインして積読を管理しましょう"
                : "アカウントを作成して始めましょう"}
            </p>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                メールアドレス
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="example@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                パスワード
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="6文字以上"
                minLength="6"
              />
            </div>

            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  パスワード（確認）
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="パスワードを再入力"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-xl font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "処理中..." : isLogin ? "ログイン" : "アカウント作成"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError("");
                setEmail("");
                setPassword("");
                setConfirmPassword("");
              }}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              {isLogin
                ? "アカウントをお持ちでない方はこちら"
                : "既にアカウントをお持ちの方はこちら"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
