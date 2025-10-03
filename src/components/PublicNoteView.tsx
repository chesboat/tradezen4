import React, { useEffect, useState } from 'react';
import { collectionGroup, query, where, getDocs } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { RichNote } from '@/types';
import { useRichNotesStore } from '@/store/useRichNotesStore';
import toast from 'react-hot-toast';
import { 
  BookOpen, 
  Briefcase, 
  User, 
  Search, 
  Lightbulb, 
  Calendar,
  Hash,
  ArrowRight,
  Loader2,
  ArrowLeft,
  Copy
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { PublicShareNav } from './PublicShareNav';

const categoryIcons = {
  study: <BookOpen className="w-4 h-4" />,
  trading: <Briefcase className="w-4 h-4" />,
  personal: <User className="w-4 h-4" />,
  research: <Search className="w-4 h-4" />,
  meeting: <Calendar className="w-4 h-4" />,
  ideas: <Lightbulb className="w-4 h-4" />,
};

export const PublicNoteView: React.FC = () => {
  const { createNote } = useRichNotesStore();
  const [note, setNote] = useState<RichNote | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Check if user is logged in
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setIsLoggedIn(!!user);
    });
    return () => unsubscribe();
  }, []);

  const handleSaveToMyNotes = async () => {
    if (!note || !isLoggedIn) return;
    
    setIsSaving(true);
    try {
      await createNote({
        title: `Copy of ${note.title}`,
        content: note.content,
        contentJSON: note.contentJSON || { type: 'doc', content: [{ type: 'paragraph' }] },
        category: note.category,
        tags: [...note.tags, 'imported'],
        isFavorite: false,
      });
      toast.success('Note saved to your collection!');
    } catch (error) {
      console.error('Failed to save note:', error);
      toast.error('Failed to save note');
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    const fetchNote = async () => {
      // Extract noteId from URL path
      const pathParts = window.location.pathname.split('/');
      const noteId = pathParts[pathParts.length - 1];
      
      if (!noteId) {
        setError('Note ID is missing');
        setLoading(false);
        return;
      }

      try {
        // Use collectionGroup to query across all users' richNotes
        // Note: Only filter by isPublic to avoid needing composite index
        const richNotesQuery = query(
          collectionGroup(db, 'richNotes'),
          where('isPublic', '==', true)
        );

        const querySnapshot = await getDocs(richNotesQuery);
        
        console.log('Found public notes:', querySnapshot.docs.length);

        // Find the note with matching ID
        const noteDoc = querySnapshot.docs.find(doc => doc.id === noteId);

        if (!noteDoc) {
          console.log('Note not found with ID:', noteId);
          setError('Note not found or is private');
          setLoading(false);
          return;
        }

        const noteData = { id: noteDoc.id, ...noteDoc.data() } as RichNote;
        console.log('Found note:', noteData.title);

        setNote(noteData);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching note:', err);
        setError('Failed to load note');
        setLoading(false);
      }
    };

    fetchNote();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading note...</p>
        </div>
      </div>
    );
  }

  if (error || !note) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-md">
          <h1 className="text-2xl font-bold">{error || 'Note not found'}</h1>
          <p className="text-muted-foreground">
            This note may have been deleted or set to private.
          </p>
          <a
            href="/"
            className="inline-block px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
          >
            Go to Refine
          </a>
        </div>
      </div>
    );
  }

  const categoryLabel = note.category.charAt(0).toUpperCase() + note.category.slice(1);
  const readingTimeMinutes = Math.max(1, Math.round(note.readingTime));

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation for logged-in users */}
      <PublicShareNav />
      
      <style>{`
        .prose a {
          word-break: break-all;
          overflow-wrap: anywhere;
        }
        .prose code {
          word-break: break-all;
          overflow-wrap: anywhere;
        }
        .prose pre {
          overflow-x: auto;
        }
      `}</style>
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-md border-b border-border">
        {/* Desktop Header */}
        <div className="hidden md:block">
          <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <span className="text-white font-bold text-sm">R</span>
              </div>
              <span className="font-semibold">Refine</span>
            </div>
            
            <div className="flex items-center gap-3">
              {isLoggedIn ? (
                <>
                  <button
                    onClick={handleSaveToMyNotes}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-accent transition-colors font-medium text-sm disabled:opacity-50"
                  >
                    <Copy className="w-4 h-4" />
                    {isSaving ? 'Saving...' : 'Save to My Notes'}
                  </button>
                  <a
                    href="/"
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium text-sm"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Journal
                  </a>
                </>
              ) : (
                <a
                  href="/signup"
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium text-sm"
                >
                  Start Your Journal
                  <ArrowRight className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Header - Apple Style */}
        <div className="md:hidden">
          {/* Logo Row */}
          <div className="px-4 py-3 flex items-center justify-center border-b border-border">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <span className="text-white font-bold text-xs">R</span>
              </div>
              <span className="font-semibold text-base">Refine</span>
            </div>
          </div>

          {/* Actions Row */}
          {isLoggedIn ? (
            <div className="px-4 py-3 flex items-center gap-3">
              <button
                onClick={handleSaveToMyNotes}
                disabled={isSaving}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-border rounded-lg active:bg-accent transition-colors font-medium text-sm disabled:opacity-50"
              >
                <Copy className="w-4 h-4 flex-shrink-0" />
                <span className="whitespace-nowrap">{isSaving ? 'Saving...' : 'Save'}</span>
              </button>
              <a
                href="/"
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg active:bg-primary/90 transition-colors font-medium text-sm"
              >
                <ArrowLeft className="w-4 h-4 flex-shrink-0" />
                <span className="whitespace-nowrap">Journal</span>
              </a>
            </div>
          ) : (
            <div className="px-4 py-3">
              <a
                href="/signup"
                className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-primary text-primary-foreground rounded-lg active:bg-primary/90 transition-colors font-medium text-sm"
              >
                <span>Start Your Journal</span>
                <ArrowRight className="w-4 h-4 flex-shrink-0" />
              </a>
            </div>
          )}
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        <motion.article
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="space-y-8"
        >
          {/* Metadata */}
          <div className="flex items-center gap-3 flex-wrap text-sm text-muted-foreground">
            {/* Category */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted">
              {categoryIcons[note.category]}
              <span>{categoryLabel}</span>
            </div>

            {/* Reading time */}
            <span>{readingTimeMinutes} min read</span>

            {/* Tags */}
            {note.tags.map((tag) => (
              <div
                key={tag}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary/10 text-primary"
              >
                <Hash className="w-3 h-3" />
                <span>{tag}</span>
              </div>
            ))}
          </div>

          {/* Title */}
          <h1 className="text-4xl md:text-5xl font-bold leading-tight">
            {note.title}
          </h1>

          {/* Date */}
          {note.updatedAt && (
            <p className="text-sm text-muted-foreground">
              Last updated {new Date(note.updatedAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          )}

          {/* Content */}
          <div
            className="prose prose-lg dark:prose-invert max-w-none break-words overflow-wrap-anywhere"
            dangerouslySetInnerHTML={{ __html: note.content }}
          />
        </motion.article>

        {/* CTA Footer - Only show for logged out users */}
        {!isLoggedIn && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="mt-16 p-8 rounded-2xl bg-gradient-to-br from-primary/10 to-purple-500/10 border border-border text-center space-y-4"
          >
            <h3 className="text-2xl font-bold">Start Your Trading Journal</h3>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Create beautiful notes, track your trades, and refine your edge—all in one place.
            </p>
            <a
              href="/signup"
              className="inline-block px-8 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-semibold"
            >
              Get Started Free
            </a>
            <p className="text-xs text-muted-foreground">
              7-day trial · Cancel anytime
            </p>
          </motion.div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-24 border-t border-border py-8">
        <div className="max-w-4xl mx-auto px-6 text-center text-sm text-muted-foreground">
          <p>
            Made with{' '}
            <a
              href="/"
              className="font-semibold hover:text-primary transition-colors"
            >
              Refine
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
};

