const Goal = require('../models/Goal');

exports.getGoals = async (req, res) => {
    try {
        const goals = await Goal.find({ userId: req.user.id });
        const now = new Date();
        const enhancedGoals = goals.map(goal => {
            const progress = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
            const totalDays = (new Date(goal.deadline) - new Date(goal.createdAt)) / (1000 * 60 * 60 * 24);
            const daysPassed = (now - new Date(goal.createdAt)) / (1000 * 60 * 60 * 24);
            const expectedProgress = (daysPassed / totalDays) * 100;
            const isAtRisk = progress < expectedProgress && (new Date(goal.deadline) - now) > 0;
            return { ...goal._doc, progress, isAtRisk };
        });
        res.json(enhancedGoals);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
};

exports.createGoal = async (req, res) => {
    const { name, targetAmount, deadline } = req.body;
    if (targetAmount <= 0) {
        return res.status(400).json({ error: 'Target amount must be positive' });
    }
    try {
        const goal = new Goal({
            userId: req.user.id,
            name,
            targetAmount,
            currentAmount: 0,
            deadline,
            createdAt: new Date()
        });
        await goal.save();
        res.json(goal);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
};

exports.contributeToGoal = async (req, res) => {
    const { id } = req.params;
    const { amount } = req.body;
    if (amount <= 0) {
        return res.status(400).json({ error: 'Contribution must be positive' });
    }
    try {
        const goal = await Goal.findOne({ _id: id, userId: req.user.id });
        if (!goal) {
            return res.status(404).json({ error: 'Goal not found' });
        }
        goal.currentAmount += amount;
        await goal.save();
        const now = new Date();
        const progress = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
        const totalDays = (new Date(goal.deadline) - new Date(goal.createdAt)) / (1000 * 60 * 60 * 24);
        const daysPassed = (now - new Date(goal.createdAt)) / (1000 * 60 * 60 * 24);
        const expectedProgress = (daysPassed / totalDays) * 100;
        const isAtRisk = progress < expectedProgress && (new Date(goal.deadline) - now) > 0;
        res.json({ ...goal._doc, progress, isAtRisk });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
};
