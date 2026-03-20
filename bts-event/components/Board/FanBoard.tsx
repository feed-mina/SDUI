"use client";

import { useState, useEffect, useCallback } from "react";
import { type Lang } from "@/components/LangToggle";
import { Loader2, Plus, ArrowLeft, MessageSquare, User, Clock, Edit2 } from "lucide-react";

interface Post {
  content_id: number;
  title: string;
  content?: string;
  user_id: string;
  reg_dt: string;
}

type View = "LIST" | "WRITE" | "DETAIL" | "UPDATE";

export default function FanBoard({ lang }: { lang: Lang }) {
  const [view, setView] = useState<View>("LIST");
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  
  // Form state
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const t = {
    ko: { list: "아미 게시판", write: "글쓰기", update: "수정", delete: "삭제", submit: "등록", cancel: "취소", back: "목록으로", placeholderTitle: "제목을 입력하세요", placeholderContent: "내용을 입력하세요", loginReq: "글을 쓰려면 로그인이 필요합니다.", empty: "게시물이 없습니다. 첫 번째 글을 작성해보세요!" },
    en: { list: "ARMY Board", write: "Write", update: "Edit", delete: "Delete", submit: "Post", cancel: "Cancel", back: "Back", placeholderTitle: "Enter title", placeholderContent: "Enter content", loginReq: "Login is required to post.", empty: "No posts yet. Be the first to share!" },
    ja: { list: "ARMY 掲示板", write: "書く", update: "編集", delete: "削除", submit: "登録", cancel: "キャンセル", back: "戻る", placeholderTitle: "タイトルを入力してください", placeholderContent: "内容を入力してください", loginReq: "投稿にはログインが必要です。", empty: "投稿がありません。最初の投稿をしてみましょう！" }
  }[lang];

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/execute/GET_CONTENT_LIST_PAGE?pageSize=20&offset=0");
      const data = await res.json();
      if (data.code === "SUCCESS" && Array.isArray(data.data)) {
        setPosts(data.data);
      }
    } catch (err) {
      console.error("Failed to fetch posts:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleWrite = async () => {
    if (!title.trim() || !content.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/execute/INSERT_CONTENT", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          content,
          emotion: 1,
          selected_times: "{}",
          daily_slots: "{}",
          day_tag1: "BTS",
          day_tag2: "ARMY",
          day_tag3: "EVENT"
        })
      });
      const result = await res.json();
      if (result.code === "SUCCESS") {
        setTitle("");
        setContent("");
        setView("LIST");
        fetchPosts();
      } else if (result.code === "UNAUTHORIZED" || result.status === 401) {
         alert(t.loginReq);
         // Redirect to login if needed
         window.open("https://sdui-delta.vercel.app/login", "_blank");
      }
    } catch (err) {
      console.error("Write error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedPost || !title.trim() || !content.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/execute/UPDATE_CONTENT_DETAIL", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content_id: selectedPost.content_id,
          title,
          content,
          emotion: 1,
          selected_times: "{}",
          daily_slots: "{}",
          day_tag1: "BTS",
          day_tag2: "ARMY",
          day_tag3: "UPDATE"
        })
      });
      const result = await res.json();
      if (result.code === "SUCCESS") {
        setView("LIST");
        fetchPosts();
      }
    } catch (err) {
      console.error("Update error:", err);
    } finally {
      setLoading(false);
    }
  };

  const openDetail = async (post: Post) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/execute/GET_CONTENT_DETAIL?contentId=${post.content_id}`);
      const data = await res.json();
      if (data.code === "SUCCESS") {
        setSelectedPost(data.data);
        setView("DETAIL");
      }
    } catch (err) {
      console.error("Detail error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (view === "WRITE" || view === "UPDATE") {
    return (
      <div className="flex flex-col h-full bg-bg-dark animate-in fade-in slide-in-from-bottom-4">
        <div className="p-4 border-b border-white/5 flex items-center justify-between">
          <button onClick={() => setView("LIST")} className="p-2 text-gray-400 hover:text-white">
            <ArrowLeft size={20} />
          </button>
          <h2 className="font-bold text-white">{view === "WRITE" ? t.write : t.update}</h2>
          <button 
            disabled={loading || !title.trim() || !content.trim()}
            onClick={view === "WRITE" ? handleWrite : handleUpdate}
            className="px-4 py-1.5 bg-bts-purple-light text-white rounded-lg font-bold text-sm disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={16} /> : t.submit}
          </button>
        </div>
        <div className="flex-1 p-4 space-y-4 overflow-y-auto">
          <input 
            className="w-full bg-transparent border-none text-xl font-bold text-white outline-none placeholder:text-gray-600"
            placeholder={t.placeholderTitle}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <textarea 
            className="w-full bg-transparent border-none text-lg text-gray-300 outline-none placeholder:text-gray-600 h-[60vh] resize-none"
            placeholder={t.placeholderContent}
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        </div>
      </div>
    );
  }

  if (view === "DETAIL" && selectedPost) {
    return (
      <div className="flex flex-col h-full bg-bg-dark overflow-y-auto">
        <div className="p-4 border-b border-white/5 flex items-center justify-between sticky top-0 bg-bg-dark/80 backdrop-blur-md">
          <button onClick={() => setView("LIST")} className="p-2 text-gray-400 hover:text-white">
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-2">
             <button onClick={() => {
                setTitle(selectedPost.title);
                setContent(selectedPost.content || "");
                setView("UPDATE");
             }} className="p-2 text-gray-400 hover:text-white">
                <Edit2 size={18} />
             </button>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-3 text-xs text-gray-500 mb-2">
            <span className="flex items-center gap-1"><User size={12} /> {selectedPost.user_id}</span>
            <span className="flex items-center gap-1"><Clock size={12} /> {new Date(selectedPost.reg_dt).toLocaleString()}</span>
          </div>
          <h1 className="text-2xl font-bold text-white leading-tight">{selectedPost.title}</h1>
          <div className="text-gray-300 text-lg leading-relaxed whitespace-pre-wrap pt-4 border-t border-white/5">
            {selectedPost.content}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-bg-dark relative">
      {/* Header Area */}
      <div className="p-4 flex items-center justify-between border-b border-white/5">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
           <MessageSquare size={20} className="text-bts-purple-light" />
           {t.list}
        </h2>
        <button 
          onClick={() => {
            setTitle("");
            setContent("");
            setView("WRITE");
          }}
          className="flex items-center gap-1 px-3 py-1.5 bg-bts-purple-light/20 text-bts-purple-light border border-bts-purple-light/30 rounded-full font-bold text-sm hover:bg-bts-purple-light hover:text-white transition-all"
        >
          <Plus size={16} /> {t.write}
        </button>
      </div>

      {/* List Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading && posts.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin text-bts-purple-light" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <div className="text-4xl mb-4">🖊️</div>
            {t.empty}
          </div>
        ) : (
          posts.map((post) => (
            <div 
              key={post.content_id}
              onClick={() => openDetail(post)}
              className="p-4 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase tracking-wider text-bts-purple-light font-bold">ARMY POST</span>
                <span className="text-[10px] text-gray-500">{new Date(post.reg_dt).toLocaleDateString()}</span>
              </div>
              <h3 className="text-white font-bold mb-1 group-hover:text-bts-purple-light transition-colors line-clamp-1">
                {post.title}
              </h3>
              <div className="flex items-center gap-2 text-[11px] text-gray-500">
                <User size={10} />
                <span>{post.user_id}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
