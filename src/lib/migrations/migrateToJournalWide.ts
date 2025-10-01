/**
 * Migration utility to convert account-specific personal items to journal-wide
 * 
 * This migration updates:
 * - Habits (TallyRules) 
 * - Rich Notes
 * - Quests
 * - Todos (ImprovementTasks)
 * 
 * By removing their accountId, making them visible across all accounts
 */

import { FirestoreService } from '@/lib/firestore';
import { deleteField, doc, updateDoc, collection } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import type { TallyRule, RichNote, Quest, ImprovementTask } from '@/types';

interface MigrationResult {
  success: boolean;
  updated: {
    habits: number;
    notes: number;
    quests: number;
    todos: number;
  };
  errors: string[];
}

// Helper function to add delay between operations
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper to get user ID
const getUserId = (): string => {
  const user = auth.currentUser;
  if (!user) throw new Error('User must be authenticated');
  return user.uid;
};

// Helper to directly update Firestore doc (bypassing FirestoreService which strips deleteField)
const directUpdate = async (collectionName: string, docId: string, data: any) => {
  const userId = getUserId();
  const docRef = doc(collection(db, `users/${userId}/${collectionName}`), docId);
  await updateDoc(docRef, data);
};

export async function migratePersonalItemsToJournalWide(): Promise<MigrationResult> {
  const result: MigrationResult = {
    success: true,
    updated: { habits: 0, notes: 0, quests: 0, todos: 0 },
    errors: [],
  };

  console.log('🔄 Starting migration to journal-wide items...');

  try {
    // Migrate Habits (TallyRules)
    const habitsService = new FirestoreService<TallyRule>('tallyRules');
    const allHabits = await habitsService.getAll();
    
    for (const habit of allHabits) {
      if (habit.accountId) {
        try {
          // Use direct update to properly handle deleteField() sentinel
          await directUpdate('tallyRules', habit.id, { 
            accountId: deleteField(),
            updatedAt: new Date().toISOString()
          });
          result.updated.habits++;
          console.log(`✅ Migrated habit: ${habit.label}`);
          await delay(100); // Small delay to avoid overwhelming Firestore
        } catch (error) {
          result.errors.push(`Failed to migrate habit ${habit.id}: ${error}`);
          console.error(`❌ Failed to migrate habit: ${habit.label}`, error);
        }
      }
    }

    // Migrate Rich Notes
    const notesService = new FirestoreService<RichNote>('richNotes');
    const allNotes = await notesService.getAll();
    
    for (const note of allNotes) {
      // Skip pseudo-account notes
      if (note.accountId && note.accountId !== 'all' && !String(note.accountId).startsWith('group:')) {
        try {
          // Use direct update to properly handle deleteField() sentinel
          await directUpdate('richNotes', note.id, { 
            accountId: deleteField(),
            updatedAt: new Date().toISOString()
          });
          result.updated.notes++;
          console.log(`✅ Migrated note: ${note.title}`);
          await delay(100); // Small delay to avoid overwhelming Firestore
        } catch (error) {
          result.errors.push(`Failed to migrate note ${note.id}: ${error}`);
          console.error(`❌ Failed to migrate note: ${note.title}`, error);
        }
      }
    }

    // Migrate Quests
    const questsService = new FirestoreService<Quest>('quests');
    const allQuests = await questsService.getAll();
    
    for (const quest of allQuests) {
      if (quest.accountId && quest.accountId !== 'all') {
        try {
          // Use direct update to properly handle deleteField() sentinel
          await directUpdate('quests', quest.id, { 
            accountId: deleteField(),
            updatedAt: new Date().toISOString()
          });
          result.updated.quests++;
          console.log(`✅ Migrated quest: ${quest.title}`);
          await delay(100); // Small delay to avoid overwhelming Firestore
        } catch (error) {
          result.errors.push(`Failed to migrate quest ${quest.id}: ${error}`);
          console.error(`❌ Failed to migrate quest: ${quest.title}`, error);
        }
      }
    }

    // Migrate Todos (ImprovementTasks)
    const todosService = new FirestoreService<ImprovementTask>('tasks');
    const allTodos = await todosService.getAll();
    
    for (const todo of allTodos) {
      if (todo.accountId && todo.accountId !== 'default') {
        try {
          // Use direct update to properly handle deleteField() sentinel
          await directUpdate('tasks', todo.id, { 
            accountId: deleteField(),
            updatedAt: new Date().toISOString()
          });
          result.updated.todos++;
          console.log(`✅ Migrated todo: ${todo.text}`);
          await delay(100); // Small delay to avoid overwhelming Firestore
        } catch (error) {
          result.errors.push(`Failed to migrate todo ${todo.id}: ${error}`);
          console.error(`❌ Failed to migrate todo: ${todo.text}`, error);
        }
      }
    }

    if (result.errors.length > 0) {
      result.success = false;
    }

    console.log('✅ Migration complete!', result);
    return result;

  } catch (error) {
    console.error('❌ Migration failed:', error);
    result.success = false;
    result.errors.push(`Migration failed: ${error}`);
    return result;
  }
}

/**
 * Helper function to check if migration is needed
 */
export async function checkIfMigrationNeeded(): Promise<boolean> {
  try {
    const habitsService = new FirestoreService<TallyRule>('tallyRules');
    const notesService = new FirestoreService<RichNote>('richNotes');
    
    const habits = await habitsService.getAll();
    const notes = await notesService.getAll();
    
    const hasAccountSpecificHabits = habits.some(h => h.accountId);
    const hasAccountSpecificNotes = notes.some(n => 
      n.accountId && n.accountId !== 'all' && !String(n.accountId).startsWith('group:')
    );
    
    return hasAccountSpecificHabits || hasAccountSpecificNotes;
  } catch (error) {
    console.error('Failed to check migration status:', error);
    return false;
  }
}

