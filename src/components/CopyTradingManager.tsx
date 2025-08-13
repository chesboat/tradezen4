import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Users, X } from 'lucide-react';
import { useAccountFilterStore } from '@/store/useAccountFilterStore';
import { TradingAccount } from '@/types';
import { cn } from '@/lib/utils';

interface CopyTradingManagerProps {
	isOpen: boolean;
	onClose: () => void;
}

export const CopyTradingManager: React.FC<CopyTradingManagerProps> = ({ isOpen, onClose }) => {
	const { accounts, updateAccount } = useAccountFilterStore();

	const leaders = useMemo(() => accounts.filter(a => (a.linkedAccountIds || []).length > 0), [accounts]);
	const defaultLeader = leaders[0] || accounts[0];
	const [leaderId, setLeaderId] = useState<string>(defaultLeader?.id || '');
	const [pendingFollowers, setPendingFollowers] = useState<Set<string>>(
		() => new Set(defaultLeader?.linkedAccountIds || [])
	);

	const leader = accounts.find(a => a.id === leaderId) as TradingAccount | undefined;

	const toggleFollower = (id: string) => {
		setPendingFollowers(prev => {
			const next = new Set(prev);
			if (next.has(id)) next.delete(id); else next.add(id);
			return next;
		});
	};

	const applyConsolidation = async () => {
		if (!leader) return;
		// 1) Clear all other leaders
		const otherLeaders = accounts.filter(a => a.id !== leader.id && (a.linkedAccountIds || []).length > 0);
		for (const l of otherLeaders) {
			await updateAccount(l.id, { linkedAccountIds: [] as any });
		}
		// 2) Apply followers to chosen leader
		await updateAccount(leader.id, { linkedAccountIds: Array.from(pendingFollowers) as any });
		onClose();
	};

	if (!isOpen) return null;

	return (
		<AnimatePresence>
			<motion.div className="fixed inset-0 z-50">
				<div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
				<div className="absolute inset-0 p-4 flex items-center justify-center">
					<div className="w-full max-w-xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
						<div className="p-4 border-b border-border flex items-center justify-between">
							<div className="flex items-center gap-2">
								<Users className="w-5 h-5 text-primary" />
								<h3 className="text-base font-semibold text-card-foreground">Copy-trading Manager</h3>
							</div>
							<button className="p-2 rounded hover:bg-muted/60" onClick={onClose}><X className="w-4 h-4" /></button>
						</div>
						<div className="p-4 space-y-4">
							<div className="space-y-1">
								<div className="text-sm font-medium">Select Leader</div>
								<div className="grid grid-cols-1 gap-2">
									{accounts.map(a => (
										<button
											key={a.id}
											onClick={() => {
												setLeaderId(a.id);
												setPendingFollowers(new Set(a.linkedAccountIds || []));
											}}
											className={cn(
												'p-3 text-left border rounded-lg transition-colors',
												a.id === leaderId ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/40'
											)}
										>
											<div className="flex items-center justify-between">
												<div className="font-medium text-foreground">{a.name}</div>
												{a.id === leaderId && <Check className="w-4 h-4 text-primary" />}
											</div>
											<div className="text-xs text-muted-foreground">{a.type} • {a.currency}</div>
										</button>
									))}
								</div>
							</div>

							<div className="space-y-2">
								<div className="text-sm font-medium">Followers for {leader?.name || '—'}</div>
								<div className="grid grid-cols-1 gap-2">
									{accounts
										.filter(a => a.id !== leaderId)
										.map(a => {
											const checked = pendingFollowers.has(a.id);
											return (
												<button
													key={a.id}
													onClick={() => toggleFollower(a.id)}
													className={cn(
														'p-3 text-left border rounded-lg transition-colors',
														checked ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/40'
													)}
												>
													<div className="flex items-center justify-between">
														<div className="font-medium text-foreground">{a.name}</div>
														{checked && <Check className="w-4 h-4 text-primary" />}
													</div>
													<div className="text-xs text-muted-foreground">{a.type} • {a.currency}</div>
												</button>
											);
										})}
								</div>
								<div className="text-xs text-muted-foreground">Note: Consolidation will clear links from other leaders so you have one group.</div>
							</div>
						</div>
						<div className="p-4 border-t border-border flex justify-end gap-2">
							<button className="px-3 py-1.5 rounded bg-muted text-muted-foreground hover:bg-muted/80" onClick={onClose}>Cancel</button>
							<button className="px-3 py-1.5 rounded bg-primary text-primary-foreground hover:bg-primary/90" onClick={applyConsolidation}>Save</button>
						</div>
					</div>
				</div>
			</motion.div>
		</AnimatePresence>
	);
};


