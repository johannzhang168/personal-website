import React, { useEffect, useState } from "react";
import Toast from "react-hot-toast";
import heic2any from "heic2any";
import imageCompression from "browser-image-compression";
import ImageDrop from "@app/components/ImageDrop";
import TagsDropdown from "@app/components/TagsDropdown";
import { v4 as uuidv4 } from "uuid";
import { useNavigate, useParams } from "react-router-dom";
import { useUser } from "@app/context/UserContext";
import NotFound from "./Empty";

const EditProjectForm: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const [name, setName] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [image, setImage] = useState<string>("");
  const [tags, setTags] = useState<string[]>([]);
  const [link, setLink] = useState<string>("");
  const [uploading, setUploading] = useState<boolean>(false);
  const baseurl = import.meta.env.VITE_API_BASE_URL;
  const navigate = useNavigate();
  const {currentUser} = useUser();

  useEffect(() => {
    const fetchProject = async () => {
      try{
        const response = await fetch(`${baseurl}/projects/get/${projectId}`);
        if (!response.ok){
          throw new Error("Failed to fetch the project");
        }
        const data = await response.json();
        setName(data.project.Name);
        setDescription(data.project.Description || "");
        setImage(data.project.Image || "");
        setTags(data.project.Tags || []);
        setLink(data.project.Link);
      }catch(error){
        Toast.error("Error fetching project")
      }
    };
    fetchProject();
  }, [projectId])

  const onDrop = async (files: File[]) => {
    setUploading(true);
    const validTypes: Set<string> = new Set([
      "image/heic",
      "image/jpeg",
      "image/png",
      "image/webp",
    ]);

    const fileToUse = files[0]

    if(fileToUse.size > 5 * 1024 * 1024){
      Toast.error("File Size Too Large! Max File Size 5MB");
      return null;
    }

    if (!validTypes.has(fileToUse.type)) {
      Toast.error("Unsupported File Type: " + fileToUse.type);
      return null;
    }

    const processFile = async (fileOrBlob: Blob) => {
      const file = new File([fileOrBlob], "image.jpg", {
        type: fileOrBlob.type,
      });
      const options = {
        maxSizeMB: 3,
        useWebWorker: true,
      };
      try {
        const compressedFile = await imageCompression(file, options);
        const compressedUrl =
          await imageCompression.getDataUrlFromFile(compressedFile);
        return compressedUrl;
      } catch (error) {
        console.error("Error compressing image:", error);
        return null; 
      }
    };

    if (fileToUse.type === "image/heic"){
      try {
        const result = await heic2any({ blob: fileToUse, toType: "image/jpeg", quality: 0.7 });
        if (!Array.isArray(result)){
          const processedFile = await processFile(result);
          processedFile !== null ? setImage(processedFile) : console.error("processed file is null")
        }
      } catch (error) {
        console.error("Error converting HEIC to JPEG:");
        return null;
      }
    }
    else {
      const processedFile = await processFile(fileToUse)
      processedFile !== null ? setImage(processedFile) : console.error("processed file is null")
    }
    console.log(image)
    setUploading(false);
  }

  const handleDelete = async () => {
    if (!projectId) return;

    const confirmDelete = window.confirm(
      "Are you sure you want to delete this newsletter? This action cannot be undone."
    );

    if (!confirmDelete) return;

    try {
      const response = await fetch(`${baseurl}/projects/delete/${projectId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.ok) {
        Toast.success("Project deleted successfully!");
        window.location.href = "/";
      } else {
        console.error("Error deleting Project:", response.statusText);
        Toast.error("Failed to delete the project.");
      }
    } catch (error) {
      console.error("Error:", error);
      Toast.error("An error occurred while deleting the project.");
    }
  };

  const handleSubmit = async () => {
    const data = {
      name,
      image,
      description,
      link,
      tags
    };
    try {
      const formData = new FormData();
      let imageUrl = data.image
      if (typeof image === "string" && image.startsWith("data:image")){
        const base64Data = image.split(",")[1];
          const contentType = image.match(/data:(.*?);base64/)?.[1] || "image/jpeg";
          const byteCharacters = atob(base64Data);
          const byteNumbers = new Array(byteCharacters.length).fill(0).map((_, i) => byteCharacters.charCodeAt(i));
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], { type: contentType });
          const uuid = uuidv4();
          formData.append("file", blob, uuid);
          const imageResponse = await fetch(baseurl + "/upload", {
            method: "POST",
            headers: {
              "X-Source-Page": "projects"
            },
            body: formData,
          });
    
          if (!imageResponse.ok){
            Toast.error("image upload error");
            return;
          }
          const imageData = await imageResponse.json()
          imageUrl = imageData.url
      }
      
      data.image = imageUrl

      const response = await fetch(`${baseurl}/projects/edit/${projectId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        Toast.success("Project submitted successfully!");
        navigate(`/`)
      } else {
        console.error("Error:", response.statusText);
      }
    } catch(error) {
      console.error("Error:", error);
    }
  }

  if(!currentUser || currentUser.status != "ADMIN") {
    return(
      <NotFound/>
    );
  }

  return(
    <div className="flex flex-col">
      <div className="flex justify-end mb-2">
        <button className="bg-red-600 w-30 h-10 px-2 text-sm text-white rounded-lg hover:bg-red-900" onClick={handleDelete}>
          Delete Project
        </button>
      </div>

      <input 
        type="text"
        placeholder="Name of the project"
        value={name}
        maxLength={50}
        onChange={(e) => setName(e.target.value)}
        className="w-full p-2 mb-4 border rounded"
      />
      <div className="mb-4 flex flex-col">
        
        <ImageDrop onDrop={onDrop}/>

        {uploading && <p>Uploading images...</p>}
        {image !== "" && (
          <div className="flex justify-center mt-4">
            <div className="relative flex-none">
              <img
                src={image}
                className="rounded-lg max-w-full max-h-[300px] object-contain"
              />
              <button
                  onClick={() =>
                    setImage("")
                  }
                  className="absolute top-3 right-3 bg-red-500 text-white text-xs w-3 h-3 flex items-center justify-center p-3 rounded-full"
                >
                  x
                </button>
            </div>  
          </div>)}
      </div>

      <div className="mb-4">
        <TagsDropdown selectedTags={tags} onChange={(updatedTags) => setTags(updatedTags)}/>
        {tags.length > 0 && (
          <ul className="list-disc list-inside">
            {tags.map((tag) => (
              <li key={tag}>{tag}</li>
            ))}
          </ul>
        )}
      </div>

      <textarea
        placeholder="Description (max 500 characters)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="w-full p-2 mb-4 border rounded"
        maxLength={500}
        rows={3}
      />

      <input 
        type="text"
        placeholder="Link to project"
        value={link}
        onChange={(e) => setLink(e.target.value)}
        className="w-full p-2 mb-4 border rounded"
      />
      <button
        onClick={handleSubmit}
        className="bg-blue-500 text-white p-2 rounded mt-4"
      >
        Edit Project Entry
      </button>
    </div>

  );
}

export default EditProjectForm;
