-- Gifts is replaced by Vodafone Bills. Any gift payments move to Others; gift budgets are dropped.
UPDATE payments SET category = 'others' WHERE category = 'gifts';
DELETE FROM budgets WHERE category = 'gifts';
