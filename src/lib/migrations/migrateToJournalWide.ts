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
import { deleteField } from 'firebase/firestore';
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
          await habitsService.update(habit.id, { accountId: deleteField() } as any);
          result.updated.habits++;
          console.log(`✅ Migrated habit: ${habit.label}`);
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
          await notesService.update(note.id, { accountId: deleteField() } as any);
          result.updated.notes++;
          console.log(`✅ Migrated note: ${note.title}`);
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
          await questsService.update(quest.id, { accountId: deleteField() } as any);
          result.updated.quests++;
          console.log(`✅ Migrated quest: ${quest.title}`);
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
          await todosService.update(todo.id, { accountId: deleteField() } as any);
          result.updated.todos++;
          console.log(`✅ Migrated todo: ${todo.text}`);
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

