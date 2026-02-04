'use client';

interface PaginationProps {
    totalCount: number;
    pageSize: number;
    currentPage: number;
    onPageChange: (page: number) => void;
}

const pagination: React.FC<PaginationProps> = ({ totalCount, pageSize, currentPage, onPageChange }) => {
    const totalPages = Math.ceil(totalCount / pageSize);
    if(totalPages <= 1) return null;

    const pages = Array.from({ length : totalPages }, (_, i) => i + 1);

    return (
        /* 인라인 스타일 삭제, 클래스명 부여 */
        <div className="pagination-container">
            {pages.map((page) => (
                <button
                    key={page}
                    onClick={() => onPageChange(page)}
                    className={`page-num-btn ${currentPage === page ? 'active' : ''}`}
                >
                    {page}
                </button>
            ))}
        </div>
    );
};

export default pagination;