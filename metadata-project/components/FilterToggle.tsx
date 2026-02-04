'use client';

interface FilterToggleProps {
    isOnlyMine: boolean;
    onToggle: () => void;
}

const FilterToggle: React.FC<FilterToggleProps> = ({ isOnlyMine, onToggle }) => {
    return (
        /* 인라인 스타일 삭제, 클래스명 부여 */
        <div className="filter-toggle-container">
            <button
                onClick={onToggle}
                className={`filter-btn ${isOnlyMine ? 'active' : ''}`}
            >
                {isOnlyMine ? '모든 일기 보기' : '내가 쓴 일기만 보기'}
            </button>
        </div>
    );
};

export default FilterToggle;