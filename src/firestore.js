import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot, 
  query, 
  orderBy 
} from 'firebase/firestore';
import { db } from './firebase.js';

// 本のコレクション名
const BOOKS_COLLECTION = 'books';

// 本を追加
export const addBook = async (bookData) => {
  try {
    const docRef = await addDoc(collection(db, BOOKS_COLLECTION), {
      ...bookData,
      addedAt: new Date(),
      read: false
    });
    return docRef.id;
  } catch (error) {
    console.error('本の追加に失敗しました:', error);
    throw error;
  }
};

// 本を更新
export const updateBook = async (bookId, bookData) => {
  try {
    const bookRef = doc(db, BOOKS_COLLECTION, bookId);
    await updateDoc(bookRef, bookData);
  } catch (error) {
    console.error('本の更新に失敗しました:', error);
    throw error;
  }
};

// 本を削除
export const deleteBook = async (bookId) => {
  try {
    const bookRef = doc(db, BOOKS_COLLECTION, bookId);
    await deleteDoc(bookRef);
  } catch (error) {
    console.error('本の削除に失敗しました:', error);
    throw error;
  }
};

// 本を読了にマーク
export const markBookAsRead = async (bookId) => {
  try {
    const bookRef = doc(db, BOOKS_COLLECTION, bookId);
    await updateDoc(bookRef, {
      read: true,
      finishedAt: new Date()
    });
  } catch (error) {
    console.error('読了マークに失敗しました:', error);
    throw error;
  }
};

// 本のリストをリアルタイムで監視
export const subscribeToBooks = (callback) => {
  const q = query(collection(db, BOOKS_COLLECTION), orderBy('addedAt', 'desc'));
  
  return onSnapshot(q, (snapshot) => {
    const books = [];
    snapshot.forEach((doc) => {
      books.push({
        id: doc.id,
        ...doc.data(),
        // FirestoreのTimestampをDateに変換
        addedAt: doc.data().addedAt?.toDate()?.getTime() || Date.now(),
        finishedAt: doc.data().finishedAt?.toDate()?.getTime() || null
      });
    });
    callback(books);
  }, (error) => {
    console.error('本の取得に失敗しました:', error);
    callback([]);
  });
};
