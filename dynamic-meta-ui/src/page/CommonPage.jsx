import React, {useEffect, useState} from "react";
import axios from "../../../metadata-project/api/axios";
import { useParams } from "react-router-dom";
import DynamicEngine from "../../../metadata-project/components/DynamicEngine";
function CommonPage() {
    const { screenId } = useParams();
    const [metadata, setMetadata] = useState([]); // 화면 설계떠
    const [formData, setFormData] = useState({});
    const [pageData, setPageData] = useState({});
    const [loading, setLoading] = useState(true); // 로딩 상태
    const [showPassword, setShowPassword] = useState(false);

    const [pwType, setPwType] = useState("password");

    const getCookie = (name) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`: ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
    };

    const isLoggedIn = !!getCookie("accessToken");
    // 메타데이터 필터링
    const filtedMetadata = metadata.map(item => {


        if(item.componentId === "pw_toggle_btn"){
            return {
                ...item,
                labelText: showPassword ? "숨기기" : "보이기"
            };
        }
        return item;
        }).filter(item => {
        if (item.componentId === "go_login_btn" || item.componentId === "go_tutorial_btn")
            return !isLoggedIn;
        if (item.componentId === "go_diary_btn" || item.componentId === "go_tutorial_btn")
            return isLoggedIn;
        return true;
    });

    useEffect(() => {
        const initializePage = async () => {
            setLoading(true);if (isLoggedIn && screenId === "LOGIN_PAGE") {
                alert("이미 로그인된 상태입니다.");
                window.location.href = "/view/MAIN_PAGE";
                return;
            }
            try{
            //     1, 화면 설계도 (Metadata)가져오기
                const uiRes = await axios.get(`/api/ui/${screenId}`);
                console.log('uiRes',uiRes);
                const metadataList = uiRes.data.data || [];
                console.log("metadataList: ", metadataList);
                setMetadata(metadataList);

                // DATA_SOURDE 타입만 필터링
                const sources = metadataList.filter(item => item.componentType === "DATA_SOURCE" && item.actionType === "AUTO_FETCH");
                console.log("sources: ", sources);

                // 병렬 APU 호출 준비
                const dataPromises = sources.map(async (source) =>{
                    // if (!isLoggedIn && source.dataSqlKey === "GET_MEMBER_DIARY_LIST"){
                    //     return {id: source.componentId, status: "success",  data: []};
                    // }
                    try{

                        const apiUrl = source.dataApiUrl.includes('/api/execute') ? source.dataApiUrl : `/api/execute/${source.dataSqlKey}`;
                        console.log("apiUrl: ", apiUrl);
                        // const res = await axios.post(apiUrl, {
                        //     params : source.dataParams
                        // },{
                        //     headers: {Authorization: `Bearer ${localStorage.getItem("accessToken")}`}
                        // });

                        const res = await axios.post(apiUrl, {
                            params : source.dataParams
                        });
                        return {id: source.componentId, status: "success",  data: res.data.data};
                    }catch(err){
                        console.error(`API 호출 실패: ${source.componentId}`, err);
                        return {id: source.componentId, data: []};
                    }
                });

                // 모든 데이터가 도착할때까지 대기
                const results = await Promise.all(dataPromises);

                // 결과들을 하나의 객체로 합치기
                const combinedData = {};
                results.forEach(res =>{
                    if (res) combinedData[res.id] = res;
                });
                // 데이터가 아예 없더라도 빈 객체라도 설정하여 엔진이 멈추지 않게 함
                setPageData(combinedData);
            } catch (error){
                console.log("에러 발생: ", error);
                if (error.response && error.response.status === 401) {
                    alert("세션이 만료되었습니다. 다시 로그인해주세요.");
                    // localStorage.removeItem("accessToken");
                    // 쿠키 삭제 : 만료일을 과거로 설정
                    document.cookie = "accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC";
                    window.location.href = "/view/LOGIN_PAGE";

                    console.error(`API 호출 실패: ${source.componentId}`, error);
                    return {id: source.componentId, data: []};

                }
            } finally {
                setLoading(false);
            };
            }
        initializePage();
    },[screenId, isLoggedIn]) // screenId가 바뀔때마다 다시 실행된다

    const handleChange = (id, value) => {
        console.log("========handleChange============");
        setFormData(prev => ({
            ...prev,
            [id]: value
        }));
    };

    const handleAction = async (item) => {
        const { actionType, actionUrl , componentId } = item;
        console.log("========handleAction============");
        console.log("실제 actionType:", actionType);
        console.log("item: ", item);


        if (actionType === "TOGGLE_PW"){
            console.log("pwType: ", pwType);
            console.log("showPassword: ", showPassword);
            console.log("item.componentId: ", componentId);

            setShowPassword(prev => !prev);
            setPwType(prev => prev === "password" ? "text" : "password");
            return;
        }

        // 1. 제출(SUBMIT) 시 필수 입력 체크
        if (actionType === "SUBMIT") {

            // 1. 이메일 아이디와 도메인을 꺼내서 합칩니다.
            const emailId = formData["user_email"];
            const emailDomain = formData["user_email_domain"];
//아이디와 도메인이 모두 있는지 확인
            if (!emailId || !emailDomain || emailDomain.trim() === "") {
                alert("이메일 아이디와 도메인을 모두 입력하거나 선택해 주세요.");
                return; // 전송 중단
            }
            // 두 값이 모두 있을 때만 합친 이메일을 만듭니다.
            const fullEmail = (emailId && emailDomain) ? `${emailId}@${emailDomain}` : "";
            const requiredFields = metadata.filter(meta => meta.isRequired);

            // 2. 서버로 보낼 최종 데이터를 준비합니다.
            // 기존 formData 복사 후, 서버가 원하는 'email' 키에 합친 값을 넣습니다.
            const submitData = {
                ...formData,
                user_email: fullEmail
            };
            // 3. 필수 입력 체크 (이메일이 비어있는지 확인)
            if (!fullEmail) {
                alert("이메일 형식을 확인해 주세요.");
                return;
            }

            // 2. 실제 서버로 데이터 보내기
            console.log("requiredFields: ", requiredFields);
            console.log("formData: ", formData);
            console.log("submitData: ", submitData);

            for (let field of requiredFields) {
                const value = formData[field.componentId];
                console.log("value: ", value);
                if (!value || value.trim() === "") {
                    alert(`${field.labelText} 항목은 필수 입력입니다`);
                    return; // 검사 탈락 시 여기서 중단
                }
            }
            // 2. 체크 통과 시 서버 전송
            try{
                console.log("서버 주소로 데이터 보내는 중:", actionUrl);

                const response = await axios.post(actionUrl, submitData);
                console.log("서버 응답:", response.data);

                // 3. JWT 토큰 저장
                if (response.data.accessToken) {
                    document.cookie = `accessToken=${response.data.accessToken}; path=/; max-age=3600`;
                    console.log("토큰 저장 완료! 메인 페이지로 이동합니다.");
                    window.location.href = `/view/MAIN_PAGE`;
                }

                window.location.href = `/view/MAIN_PAGE`;
            } catch(error){
                const errorMsg = error.response?.data?.message || "로그인 정보를 다시 확인해주세요.";
                console.log("에러 발생: ", error.message);
                console.log("errorMsg: ", errorMsg);
            }

            // 검사 통과 후 실제 전송 로직
            console.log("액션 타입: ", actionType, " 서버로 보낼 데이터: ", formData);
        }

        // 2. 이동(LINK) 처리
        else if (actionType === "LINK") {
            console.log(`${actionUrl} 주소로 이동`);
            window.location.href = item.actionUrl;
        }
    }; // onAction 함수는 여기서 끝납니다.

    if (loading) return <div> 화면 정보를 읽어오는 중입니다...</div>;

    return (
        <div className={`page-wrap ${screenId}`}>
            <DynamicEngine
                metadata={filtedMetadata}
                onChange={handleChange}
                onAction={handleAction}
                pageData={pageData} // 데이터 꾸러미 전달
                pwType={pwType}
                showPassword={showPassword}
            />
        </div>
    );
}
export default CommonPage;