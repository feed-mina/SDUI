//  @@@@ 2026-02-07 추가 컴포넌트들을 한곳에 관리하는 파일
import InputField from "@/components/fields/InputField";
import TextField from "@/components/fields/TextField";
import ButtonField from "@/components/fields/ButtonField";
import ImageField from "@/components/fields/ImageField";
import SelectField from "@/components/fields/SelectField";
import PasswordField from "@/components/fields/PasswordField";
import TextAreaField from "@/components/fields/TextAreaField";
import EmailSelectField from "@/components/fields/EmailSelectField";
import EmotionSelectField from "@/components/fields/EmotionSelectField";
import RecordTimeComponent from "@/components/fields/RecordTimeComponent";
import DateTimePicker from "@/components/fields/DateTimePicker";
import TimeSelect from "@/components/fields/TimeSelect";
import TimeSlotRecord from "@/components/fields/TimeSlotRecord";

export const componentMap: Record<string, React.FC<any>> = {
    INPUT: InputField,
    TEXT: TextField,
    PASSWORD: PasswordField,
    BUTTON: ButtonField,
    SNS_BUTTON: ButtonField,
    LINK_BUTTON: ButtonField,
    IMAGE: ImageField,
    EMAIL_SELECT: EmailSelectField,
    EMOTION_SELECT: EmotionSelectField,
    SELECT: SelectField,
    TEXTAREA: TextAreaField,
    TIME_RECORD_WIDGET: RecordTimeComponent,
    DATETIME_PICKER: DateTimePicker,
    TIME_SELECT: TimeSelect,
    TIME_SLOT_RECORD: TimeSlotRecord,
    GROUP: ({children}) => <>{children}</>,
};