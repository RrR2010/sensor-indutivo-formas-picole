"""Import and conservatively clean the CAD GLB; preserve the source file."""
import bpy
import bmesh
import math
import os
import json
import struct
from mathutils import Matrix, Vector, kdtree

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SOURCE = os.path.join(ROOT, 'Referências', 'Forma 90g', 'Forma 90g.glb')
OUT = os.path.join(ROOT, 'Modelos', 'Forma_90g')
os.makedirs(OUT, exist_ok=True)
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.gltf(filepath=SOURCE)
objects = [o for o in bpy.context.scene.objects if o.type == 'MESH']
assert len(objects) == 1, 'Unexpected CAD structure; review before merging.'
obj = objects[0]
obj.name = 'Forma_90g'
bpy.context.view_layer.objects.active = obj
bpy.ops.object.select_all(action='DESELECT')
obj.select_set(True)
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

# The CAD arrives on its side. Rotate its open side (-Y) upward (+Z).
rotation = Matrix.Rotation(-math.pi/2, 4, 'X')
obj.data.transform(rotation)
before = [v.co.copy() for v in obj.data.vertices]
def bounds(points):
    return (Vector(tuple(min(p[i] for p in points) for i in range(3))),
            Vector(tuple(max(p[i] for p in points) for i in range(3))))
lo, hi = bounds(before)
offset = Vector(((lo.x+hi.x)/2, (lo.y+hi.y)/2, lo.z))

bm = bmesh.new()
bm.from_mesh(obj.data)
input_vertices = len(bm.verts)
input_faces = len(bm.faces)
input_boundaries = sum(e.is_boundary for e in bm.edges)
bmesh.ops.remove_doubles(bm, verts=list(bm.verts), dist=0.000001)
bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))
assert all(e.is_manifold for e in bm.edges), 'Open or nonmanifold edges after welding.'
assert all(f.calc_area() > 1e-14 for f in bm.faces), 'Degenerate face.'
bm.to_mesh(obj.data)
bm.free()
if obj.data.has_custom_normals:
    bpy.ops.mesh.customdata_custom_splitnormals_clear()
after = [v.co.copy() for v in obj.data.vertices]
after_lo, after_hi = bounds(after)
assert (after_lo-lo).length < 0.000002 and (after_hi-hi).length < 0.000002
tree=kdtree.KDTree(len(after))
for i,p in enumerate(after): tree.insert(p,i)
tree.balance()
max_shift=max(tree.find(p)[2] for p in before)
assert max_shift <= 0.0000011, 'Cleanup changed the CAD shape.'
for v in obj.data.vertices: v.co -= offset
obj.data.name = 'Forma_90g_Malha_Limpa'
obj.data.materials.clear()
mat=bpy.data.materials.new('Metal_Forma')
mat.use_nodes=True
mat.diffuse_color=(.5,.53,.56,1)
bsdf=mat.node_tree.nodes.get('Principled BSDF')
bsdf.inputs['Base Color'].default_value=mat.diffuse_color
bsdf.inputs['Metallic'].default_value=.75
bsdf.inputs['Roughness'].default_value=.4
obj.data.materials.append(mat)
for polygon in obj.data.polygons:
    polygon.material_index=0
    polygon.use_smooth=True
obj.data.set_sharp_from_angle(angle=math.radians(30))
obj.data.update()
obj['origem']='Centro da base; abertura para +Z no Blender, +Y no GLB.'
obj['fonte']='Referências/Forma 90g/Forma 90g.glb'
obj['limpeza']='Soldagem 0.001 mm; sem decimacao, remesh ou alteracao das abas.'
obj['dimensoes_mm']=[round(v*1000,3) for v in hi-lo]
scene=bpy.context.scene
scene.unit_settings.system='METRIC'
scene.unit_settings.length_unit='MILLIMETERS'
asset_collection=bpy.data.collections.new('Forma_90g_Asset')
scene.collection.children.link(asset_collection)
for c in list(obj.users_collection): c.objects.unlink(obj)
asset_collection.objects.link(obj)
glb=os.path.join(OUT,'forma_90g.glb')
bpy.ops.export_scene.gltf(filepath=glb,export_format='GLB',use_selection=True,export_yup=True)

with open(glb,'rb') as f:
    f.seek(12)
    size,_=struct.unpack('<II',f.read(8))
    data=json.loads(f.read(size))
primitives=[p for m in data['meshes'] for p in m['primitives']]
assert len(primitives)==1 and len(data['materials'])==1
assert not data.get('textures') and not data.get('cameras')
metrics={'vertices_before':input_vertices,'vertices_after':len(obj.data.vertices),
    'triangles':sum(data['accessors'][p['indices']]['count']//3 for p in primitives),
    'boundary_edges_before':input_boundaries,'boundary_edges_after':0,
    'max_vertex_shift_mm':max_shift*1000,'dimensions_blender_mm':obj['dimensoes_mm'].to_list(),
    'glb_primitives':len(primitives),'glb_bytes':os.path.getsize(glb)}

studio=bpy.data.collections.new('Estudio_Preview')
scene.collection.children.link(studio)
def put_in_studio(o):
    for c in list(o.users_collection): c.objects.unlink(o)
    studio.objects.link(o)
center=Vector((0,0,(hi.z-lo.z)/2))
bpy.ops.object.camera_add(location=(.58,-.7,.6))
camera=bpy.context.object
camera.name='Camera_Forma'
camera.rotation_euler=(center-camera.location).to_track_quat('-Z','Y').to_euler()
camera.data.type='ORTHO'
camera.data.ortho_scale=.57
camera.data.clip_start=.001
scene.camera=camera
put_in_studio(camera)
scene.render.engine='BLENDER_WORKBENCH'
scene.display.shading.light='STUDIO'
scene.display.shading.color_type='MATERIAL'
scene.display.shading.show_cavity=True
scene.display.shading.cavity_type='BOTH'
scene.render.resolution_x=1400
scene.render.resolution_y=1000
scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG'
scene.render.film_transparent=True
scene.render.filepath=os.path.join(OUT,'forma_90g_preview.png')
for screen in bpy.data.screens:
    for area in screen.areas:
        if area.type=='VIEW_3D':
            area.spaces.active.region_3d.view_distance=.7
            area.spaces.active.region_3d.view_location=center
            area.spaces.active.region_3d.view_rotation=camera.rotation_euler.to_quaternion()
            area.spaces.active.clip_start=.001
bpy.ops.object.select_all(action='DESELECT')
obj.select_set(True)
bpy.context.view_layer.objects.active=obj
bpy.context.preferences.filepaths.save_version=0
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT,'forma_90g.blend'))
bpy.ops.render.render(write_still=True)

# Round trip: validate the delivery, not just the in-memory source mesh.
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.gltf(filepath=glb)
reimported=[o for o in scene.objects if o.type=='MESH']
assert len(reimported)==1 and len(reimported[0].data.materials)==1
points=[o.matrix_world@v.co for o in reimported for v in o.data.vertices]
check_lo,check_hi=bounds(points)
assert ((check_hi-check_lo)-(hi-lo)).length < 0.000002
assert (check_lo-(lo-offset)).length < 0.000002
metrics['glb_roundtrip']='passed'
print('FORMA_OK',json.dumps(metrics))
