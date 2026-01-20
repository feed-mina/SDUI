'use client';

interface FilterToggleProps {
    isOnlyMine: boolean;
    onToggle: () => void;
}

const FilterToggle: React.FC<FilterToggleProps> = ({ isOnlyMine, onToggle }) => {
    return (
        <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%', maxWidth: '600px', marginBottom: '15px' }}>

            <button
                onClick={onToggle}
                style={{
                    padding: '8px 16px',
                    cursor: 'pointer',
                    borderRadius: '20px',
                    border: '1px solid #4A90E2',
                    backgroundColor: isOnlyMine ? '#4A90E2' : '#fff',
                    color: isOnlyMine ? '#fff' : '#4A90E2',
                    fontWeight: 'bold',
                    transition: 'all 0.3s'
                }}
            >
                {isOnlyMine ? '모든 일기 보기' : '내가 쓴 일기만 보기'}
            </button>
        </div>
    );
};

export default FilterToggle;