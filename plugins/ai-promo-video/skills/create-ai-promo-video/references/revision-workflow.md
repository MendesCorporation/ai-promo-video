# Incremental Revision Workflow

Preserve the existing project and timeline when feedback affects one shot.

1. Identify the smallest complete interval that contains the change, including transition handles.
2. List and read the existing source with `list_advanced_video_files` and `read_advanced_video_file`, then patch exact text with `patch_advanced_video_file`; do not recreate unrelated scenes.
3. Render the same absolute interval with `render_advanced_video.rangeStart` and `rangeEnd`.
4. Probe the patch. Its duration, dimensions, FPS, and audio presence must match the selected final-video range.
5. Review frames inside the patch and immediately before and after both boundaries.
6. Use `replace_video_range` to create a new final MP4 while leaving the original untouched.
7. Probe and review the revised final, including audio continuity at both seams.

Use `edit_capture_image` or `edit_video` when only source media needs crop, color, redaction, trim, speed, or audio adjustment. Update the scene to reference the derived asset and rerender its interval.

Perform a full rerender when global duration, resolution, FPS, master music, shared layout code, global shader/environment, or changes spanning many scenes make a local replacement unsafe.
