import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "./firebase.js";

// ユーザー別の本のコレクション名
const getBooksCollection = (userId) => `users/${userId}/books`;

// 本を追加
export const addBook = async (userId, bookData) => {
  try {
    const docRef = await addDoc(collection(db, getBooksCollection(userId)), {
      ...bookData,
      addedAt: new Date(),
      read: false,
    });
    return docRef.id;
  } catch (error) {
    console.error("本の追加に失敗しました:", error);
    throw error;
  }
};

// 本を更新
export const updateBook = async (userId, bookId, bookData) => {
  try {
    const bookRef = doc(db, getBooksCollection(userId), bookId);
    await updateDoc(bookRef, bookData);
  } catch (error) {
    console.error("本の更新に失敗しました:", error);
    throw error;
  }
};

// 本を削除
export const deleteBook = async (userId, bookId) => {
  try {
    const bookRef = doc(db, getBooksCollection(userId), bookId);
    await deleteDoc(bookRef);
  } catch (error) {
    console.error("本の削除に失敗しました:", error);
    throw error;
  }
};

// 本を読了にマーク
export const markBookAsRead = async (userId, bookId) => {
  try {
    const bookRef = doc(db, getBooksCollection(userId), bookId);
    await updateDoc(bookRef, {
      read: true,
      finishedAt: new Date(),
    });
  } catch (error) {
    console.error("読了マークに失敗しました:", error);
    throw error;
  }
};

// 本のリストをリアルタイムで監視
export const subscribeToBooks = (userId, callback) => {
  if (!userId) {
    callback([]);
    return () => {};
  }

  const q = query(
    collection(db, getBooksCollection(userId)),
    orderBy("addedAt", "desc")
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const books = [];
      snapshot.forEach((doc) => {
        books.push({
          id: doc.id,
          ...doc.data(),
          // FirestoreのTimestampをDateに変換
          addedAt: doc.data().addedAt?.toDate()?.getTime() || Date.now(),
          finishedAt: doc.data().finishedAt?.toDate()?.getTime() || null,
        });
      });
      callback(books);
    },
    (error) => {
      console.error("本の取得に失敗しました:", error);
      callback([]);
    }
  );
};
