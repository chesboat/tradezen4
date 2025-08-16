import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, TrendingUp, Target, DollarSign, TrendingDown, RotateCcw, BarChart3 } from 'lucide-react';

interface EdgeScoreExplanationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const EdgeScoreExplanationModal: React.FC<EdgeScoreExplanationModalProps> = ({
  isOpen,
  onClose,
}) => {
  const metrics = [
    {
      name: 'Win Rate',
      icon: Target,
      description: 'Percentage of trades that are profitable (excluding scratches)',
      formula: 'Winning Trades ÷ Total Trades (excluding scratches) × 100',
      scoring: [
        { range: '≥70%', score: '90-100 points', color: 'text-green-600' },
        { range: '60-69%', score: '70-89 points', color: 'text-green-500' },
        { range: '50-59%', score: '50-69 points', color: 'text-yellow-500' },
        { range: '40-49%', score: '30-49 points', color: 'text-orange-500' },
        { range: '<40%', score: '0-29 points', color: 'text-red-500' },
      ],
      example: 'If you have 7 wins out of 10 trades (3 losses), your win rate is 70%'
    },
    {
      name: 'Average Win/Loss Ratio',
      icon: TrendingUp,
      description: 'How much you make on winning trades vs. how much you lose on losing trades',
      formula: 'Average Win Amount ÷ Average Loss Amount',
      scoring: [
        { range: '≥3.0', score: '90-100 points', color: 'text-green-600' },
        { range: '2.0-2.9', score: '70-89 points', color: 'text-green-500' },
        { range: '1.5-1.9', score: '50-69 points', color: 'text-yellow-500' },
        { range: '1.0-1.4', score: '30-49 points', color: 'text-orange-500' },
        { range: '<1.0', score: '0-29 points', color: 'text-red-500' },
      ],
      example: 'If your average win is $300 and average loss is $150, your ratio is 2.0'
    },
    {
      name: 'Profit Factor',
      icon: DollarSign,
      description: 'Total profits divided by total losses - measures overall profitability',
      formula: 'Total Gross Profit ÷ Total Gross Loss',
      scoring: [
        { range: '≥2.0', score: '90-100 points', color: 'text-green-600' },
        { range: '1.5-1.9', score: '70-89 points', color: 'text-green-500' },
        { range: '1.2-1.4', score: '50-69 points', color: 'text-yellow-500' },
        { range: '1.0-1.1', score: '30-49 points', color: 'text-orange-500' },
        { range: '<1.0', score: '0-29 points', color: 'text-red-500' },
      ],
      example: 'If you made $2000 in profits and lost $1000, your profit factor is 2.0'
    },
    {
      name: 'Max Drawdown',
      icon: TrendingDown,
      description: 'Largest peak-to-trough decline in your account balance',
      formula: '(Peak Balance - Trough Balance) ÷ Peak Balance × 100',
      scoring: [
        { range: '≤5%', score: '90-100 points', color: 'text-green-600' },
        { range: '5-10%', score: '70-89 points', color: 'text-green-500' },
        { range: '10-20%', score: '50-69 points', color: 'text-yellow-500' },
        { range: '20-30%', score: '30-49 points', color: 'text-orange-500' },
        { range: '>30%', score: '0-29 points', color: 'text-red-500' },
      ],
      example: 'If your account went from $10,000 to $8,500, your max drawdown is 15%'
    },
    {
      name: 'Recovery Factor',
      icon: RotateCcw,
      description: 'How quickly you recover from drawdowns - net profit divided by max drawdown',
      formula: 'Net Profit ÷ Max Drawdown Amount',
      scoring: [
        { range: '≥5.0', score: '90-100 points', color: 'text-green-600' },
        { range: '3.0-4.9', score: '70-89 points', color: 'text-green-500' },
        { range: '2.0-2.9', score: '50-69 points', color: 'text-yellow-500' },
        { range: '1.0-1.9', score: '30-49 points', color: 'text-orange-500' },
        { range: '<1.0', score: '0-29 points', color: 'text-red-500' },
      ],
      example: 'If you made $1500 net profit with a $500 max drawdown, your recovery factor is 3.0'
    },
    {
      name: 'Consistency',
      icon: BarChart3,
      description: 'How consistent your monthly returns are - lower volatility is better',
      formula: 'Based on standard deviation of monthly returns',
      scoring: [
        { range: 'Very Low Volatility', score: '90-100 points', color: 'text-green-600' },
        { range: 'Low Volatility', score: '70-89 points', color: 'text-green-500' },
        { range: 'Moderate Volatility', score: '50-69 points', color: 'text-yellow-500' },
        { range: 'High Volatility', score: '30-49 points', color: 'text-orange-500' },
        { range: 'Very High Volatility', score: '0-29 points', color: 'text-red-500' },
      ],
      example: 'Steady 2-3% monthly gains score higher than volatile +10%, -5%, +8% months'
    }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={onClose}
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={onClose}
          >
            <div
              className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Edge Score Metrics Explained
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Understanding how your trading performance is measured
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                <div className="space-y-8">
                  {/* Overall Explanation */}
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                    <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                      What is Edge Score?
                    </h3>
                    <p className="text-blue-800 dark:text-blue-200 text-sm">
                      Edge Score is a comprehensive metric (0-100) that evaluates your trading performance 
                      across six key dimensions. Each metric is weighted based on its importance to long-term 
                      trading success, with higher emphasis on profitability and risk management.
                    </p>
                  </div>

                  {/* Metrics Grid */}
                  <div className="grid gap-6">
                    {metrics.map((metric, index) => {
                      const IconComponent = metric.icon;
                      return (
                        <div
                          key={index}
                          className="border border-gray-200 dark:border-gray-700 rounded-lg p-6"
                        >
                          <div className="flex items-start gap-4">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                              <IconComponent className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                                {metric.name}
                              </h4>
                              
                              <p className="text-gray-600 dark:text-gray-400 mb-3">
                                {metric.description}
                              </p>
                              
                              <div className="bg-gray-50 dark:bg-gray-700/50 rounded p-3 mb-3">
                                <p className="text-sm font-mono text-gray-700 dark:text-gray-300">
                                  <span className="font-semibold">Formula:</span> {metric.formula}
                                </p>
                              </div>
                              
                              <div className="mb-3">
                                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                  Scoring Ranges:
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                  {metric.scoring.map((score, scoreIndex) => (
                                    <div
                                      key={scoreIndex}
                                      className="flex justify-between items-center text-xs bg-white dark:bg-gray-800 rounded px-2 py-1 border border-gray-200 dark:border-gray-600"
                                    >
                                      <span className="font-medium">{score.range}</span>
                                      <span className={score.color}>{score.score}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                              
                              <div className="bg-green-50 dark:bg-green-900/20 rounded p-3">
                                <p className="text-sm text-green-800 dark:text-green-200">
                                  <span className="font-semibold">Example:</span> {metric.example}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Footer Note */}
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                      Metric Weights
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Profit Factor:</span> 25%
                      </div>
                      <div>
                        <span className="font-medium">Win Rate:</span> 20%
                      </div>
                      <div>
                        <span className="font-medium">Avg Win/Loss:</span> 20%
                      </div>
                      <div>
                        <span className="font-medium">Max Drawdown:</span> 15%
                      </div>
                      <div>
                        <span className="font-medium">Recovery Factor:</span> 10%
                      </div>
                      <div>
                        <span className="font-medium">Consistency:</span> 10%
                      </div>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 text-xs mt-2">
                      * Weights are designed to emphasize profitability and risk management over pure win rate
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default EdgeScoreExplanationModal;
