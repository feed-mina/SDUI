'use client';

interface PaginationProps {
    totalCount: number; // 전체 데이터 개수
    pageSize: number; // 한 페이지에 보여줄 개수
    currentPage: number; // 현재 내가 보고 있는 페이지 번호
    onPageChange: (page: number) => void; // 번호를 눌럿을때 실행할 함수
}

const pagination: React.FC<PaginationProps> = ({ totalCount, pageSize, currentPage, onPageChange }) => {
    // 총 페이지 수 계산 : 7 / 5 = 1.4 -> 올림해서 2
    const totalPages = Math.ceil(totalCount / pageSize);

    // 2. 만약 페이지가 1개 뿐이라면 버튼을 보여주지 않는다.
    if(totalPages <= 1) return null;

    // 3. {1,2} 처럼 숫자 배열 만들기
    const pages = Array.from({ length : totalPages }, (_, i) => i + 1);

    return (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px', marginBottom: '20px'}}>
            {pages.map((page) => (
                <button
                    key={page}
                onClick={() => onPageChange(page)}
                style={{
                    padding: '5px 10px', backgroundColor: currentPage === page ? '#ccc' : '#fff'
                }}>
                    {page}
                </button>

            ))}
        </div>
    );
};

export default pagination;