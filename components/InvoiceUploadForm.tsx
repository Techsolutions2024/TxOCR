
import React, { useState, useCallback, ChangeEvent, useRef } from 'react';

export interface UploadedFilePayload {
  file: File;
  base64Image: string;
  previewUrl: string;
}

interface InvoiceUploadFormProps {
  onImageUpload: (files: UploadedFilePayload[]) => void;
  isProcessing: boolean;
}

const InvoiceUploadForm: React.FC<InvoiceUploadFormProps> = ({ onImageUpload, isProcessing }) => {
  const [selectedPayloads, setSelectedPayloads] = useState<UploadedFilePayload[]>([]);
  const [formError, setFormError] = useState<string | null>(null);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = useCallback(async (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files ? Array.from(event.target.files) : [];
    if (files.length === 0) {
      return;
    }
    
    setFormError(null); 

    let currentErrors: string[] = [];

    const fileProcessingPromises = files.map(file => {
      return new Promise<UploadedFilePayload | null>((resolve) => {
        if (!file.type.startsWith('image/')) {
          currentErrors.push(`${file.name}: Loại tệp không hợp lệ. Chỉ chấp nhận tệp hình ảnh.`);
          resolve(null);
          return;
        }
        if (file.size > 5 * 1024 * 1024) { // 5MB limit
          currentErrors.push(`${file.name}: Kích thước tệp quá lớn (tối đa 5MB).`);
          resolve(null);
          return;
        }
        
        const reader = new FileReader();
        reader.onloadend = () => {
          const previewUrl = reader.result as string;
          const base64Data = previewUrl.split(',')[1];
          if (base64Data) {
            resolve({ file, base64Image: base64Data, previewUrl });
          } else {
            currentErrors.push(`${file.name}: Không thể đọc dữ liệu ảnh.`);
            resolve(null);
          }
        };
        reader.onerror = () => {
           currentErrors.push(`${file.name}: Lỗi khi đọc tệp.`);
           resolve(null);
        };
        reader.readAsDataURL(file);
      });
    });

    const results = await Promise.all(fileProcessingPromises);
    const newValidPayloads = results.filter(p => p !== null) as UploadedFilePayload[];
    
    setSelectedPayloads(prevPayloads => [...prevPayloads, ...newValidPayloads]); 

    if (currentErrors.length > 0) {
      setFormError(currentErrors.join('\n'));
    }
    // Reset the input value to allow selecting the same file again if needed
    if (event.target) {
        event.target.value = '';
    }
  }, []);

  const triggerCameraInput = () => {
    cameraInputRef.current?.click();
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = useCallback(() => {
    if (selectedPayloads.length > 0) {
      onImageUpload(selectedPayloads);
    } else {
      setFormError("Vui lòng chọn ít nhất một tệp ảnh hóa đơn hoặc chụp ảnh mới.");
    }
  }, [selectedPayloads, onImageUpload]);

  const handleClearSelection = useCallback(() => {
    selectedPayloads.forEach(payload => {
        if (payload.previewUrl.startsWith('data:')) {
            // No need to revoke data URLs
        } else {
            URL.revokeObjectURL(payload.previewUrl);
        }
    });
    setSelectedPayloads([]);
    setFormError(null);
    if (cameraInputRef.current) cameraInputRef.current.value = '';
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [selectedPayloads]);

  React.useEffect(() => {
    return () => {
      selectedPayloads.forEach(payload => {
        if (payload.previewUrl.startsWith('data:')) {
            // No need to revoke data URLs
        } else {
             URL.revokeObjectURL(payload.previewUrl);
        }
      });
    };
  }, [selectedPayloads]);


  return (
    <div className="w-full max-w-2xl p-6 bg-white rounded-xl shadow-xl space-y-6">
      <h2 className="text-3xl font-bold text-center text-gray-800">Tải Lên Hóa Đơn</h2>
      
      {formError && (
        <div className="bg-red-50 p-3 rounded-md">
          {formError.split('\n').map((err, idx) => (
            <p key={idx} className="text-sm text-red-600">{err}</p>
          ))}
        </div>
      )}

      {/* Hidden file inputs */}
      <input
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        ref={cameraInputRef}
        style={{ display: 'none' }}
        disabled={isProcessing}
      />
      <input
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileChange}
        ref={fileInputRef}
        style={{ display: 'none' }}
        disabled={isProcessing}
      />

      <div className="space-y-4 sm:space-y-0 sm:flex sm:space-x-4">
        <button
          onClick={triggerCameraInput}
          disabled={isProcessing}
          className="w-full sm:w-1/2 flex items-center justify-center px-5 py-3 border border-sky-500 text-sky-600 hover:bg-sky-50 focus:bg-sky-100 rounded-lg text-sm font-semibold transition-colors duration-150 disabled:opacity-50 disabled:pointer-events-none"
          aria-label="Chụp ảnh hóa đơn mới"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Chụp Ảnh
        </button>
        <button
          onClick={triggerFileInput}
          disabled={isProcessing}
          className="w-full sm:w-1/2 flex items-center justify-center px-5 py-3 border border-blue-500 text-blue-600 hover:bg-blue-50 focus:bg-blue-100 rounded-lg text-sm font-semibold transition-colors duration-150 disabled:opacity-50 disabled:pointer-events-none"
          aria-label="Chọn tệp ảnh hóa đơn từ thiết bị"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          Chọn Tệp
        </button>
      </div>
      <p className="text-xs text-gray-500 text-center">Chấp nhận JPG, PNG, WEBP. Tối đa 5MB/tệp.</p>


      {selectedPayloads.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-md font-medium text-gray-700">Các tệp đã chọn ({selectedPayloads.length}):</h3>
          <div className="max-h-60 overflow-y-auto space-y-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
            {selectedPayloads.map((payload, index) => (
              <div key={index} className="flex items-center space-x-3 p-2 bg-white rounded-md shadow-sm">
                <img src={payload.previewUrl} alt={`Xem trước ${payload.file.name}`} className="w-16 h-16 object-contain rounded border border-gray-200" />
                <span className="text-sm text-gray-600 truncate" title={payload.file.name}>{payload.file.name}</span>
              </div>
            ))}
          </div>
           <button
            onClick={handleClearSelection}
            disabled={isProcessing}
            className="w-full sm:w-auto px-4 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
          >
            Xóa tất cả lựa chọn
          </button>
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={selectedPayloads.length === 0 || isProcessing}
        className="w-full flex items-center justify-center px-6 py-3.5 border border-transparent text-base font-semibold rounded-lg shadow-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-150"
      >
        {isProcessing ? (
          <>
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Đang xử lý ({selectedPayloads.length} tệp)...
          </>
        ) : (
          `Trích Xuất Thông Tin ${selectedPayloads.length > 0 ? `(${selectedPayloads.length} tệp)` : ''}`
        )}
      </button>
    </div>
  );
};

export default InvoiceUploadForm;
