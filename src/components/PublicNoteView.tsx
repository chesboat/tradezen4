import React, { useEffect, useState } from 'react';
import { collectionGroup, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { RichNote } from '@/types';
import { 
  BookOpen, 
  Briefcase, 
  User, 
  Search, 
  Lightbulb, 
  Calendar,
  Hash,
  ArrowRight,
  Loader2
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const categoryIcons = {
  study: <BookOpen className="w-4 h-4" />,
  trading: <Briefcase className="w-4 h-4" />,
  personal: <User className="w-4 h-4" />,
  research: <Search className="w-4 h-4" />,
  meeting: <Calendar className="w-4 h-4" />,
  ideas: <Lightbulb className="w-4 h-4" />,
};

export const PublicNoteView: React.FC = () => {
  const [note, setNote] = useState<RichNote | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        const richNotesQuery = query(
          collectionGroup(db, 'richNotes'),
          where('id', '==', noteId),
          where('isPublic', '==', true)
        );

        const querySnapshot = await getDocs(richNotesQuery);

        if (querySnapshot.empty) {
          setError('Note not found or is private');
          setLoading(false);
          return;
        }

        const noteDoc = querySnapshot.docs[0];
        const noteData = { id: noteDoc.id, ...noteDoc.data() } as RichNote;

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
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">R</span>
            </div>
            <span className="font-semibold">Refine</span>
          </div>
          <a
            href="/signup"
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium text-sm"
          >
            Start Your Journal
            <ArrowRight className="w-4 h-4" />
          </a>
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
            className="prose prose-lg dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: note.content }}
          />
        </motion.article>

        {/* CTA Footer */}
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

