import bpy
import math
import os
from mathutils import Vector

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'Modelos', 'Sensor_indutivo_M18')
os.makedirs(OUT, exist_ok=True)
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
for data in list(bpy.data.materials):
    bpy.data.materials.remove(data)

def material(name, color, metallic=0, roughness=.45):
    m = bpy.data.materials.new(name)
    m.diffuse_color = (*color, 1)
    m.use_nodes = True
    p = m.node_tree.nodes.get('Principled BSDF')
    p.inputs['Base Color'].default_value = (*color, 1)
    p.inputs['Metallic'].default_value = metallic
    p.inputs['Roughness'].default_value = roughness
    return m

metal = material('Metal_Corpo', (.42, .40, .34), .75, .32)
black = material('Plastico_Preto', (.018, .022, .026))
yellow = material('Face_Amarela', (.95, .67, .015))
label = material('Etiqueta_Cinza', (.65, .68, .69), .1)
light = material('Luz_Indicadora_Material', (.65, .005, .008), 0, .28)
light.node_tree.nodes.get('Principled BSDF').inputs['Emission Color'].default_value = (1, .005, .008, 1)
light.node_tree.nodes.get('Principled BSDF').inputs['Emission Strength'].default_value = .5

parts = []
def finish(obj, name, mat, bevel=0):
    obj.name = name
    obj.data.materials.append(mat)
    if bevel:
        mod = obj.modifiers.new('Bordas_suaves', 'BEVEL')
        mod.width = bevel
        mod.segments = 2
        bpy.context.view_layer.objects.active = obj
        bpy.ops.object.modifier_apply(modifier=mod.name)
    for p in obj.data.polygons:
        p.use_smooth = abs(p.normal.z) < .99
    parts.append(obj)
    return obj

def cylinder(name, r, depth, z, mat, bevel=.12):
    bpy.ops.mesh.primitive_cylinder_add(vertices=64, radius=r, depth=depth, location=(0, 0, z))
    return finish(bpy.context.object, name, mat, bevel)

def ring(name, outer, inner, bottom, top, mat, n=64):
    verts = []
    for z, r in [(bottom, outer), (top, outer), (bottom, inner), (top, inner)]:
        verts.extend([(r*math.cos(i*2*math.pi/n), r*math.sin(i*2*math.pi/n), z) for i in range(n)])
    faces = []
    for i in range(n):
        j = (i+1)%n
        faces.extend([(i,j,n+j,n+i), (2*n+j,2*n+i,3*n+i,3*n+j),
                      (n+i,n+j,3*n+j,3*n+i), (j,i,2*n+i,2*n+j)])
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    return finish(obj, name, mat)

# Coordinates below are millimetres. Front face is at Z=0, facing -Z.
cylinder('Face_Sensora', 8.65, 6.5, 3.25, yellow, .3)
cylinder('Aro_Frontal', 8.9, 2, 7.5, black)
cylinder('Corpo_Metalico', 8.38, 53, 35, metal)

# Continuous simplified M18 x 1 helix: 18 mm maximum outside diameter.
verts, faces = [], []
turns, steps = 37, 48
profile = [(8.36,-.43),(9,0),(8.36,.43)]
for i in range(turns*steps+1):
    a = 2*math.pi*i/steps
    for r,dz in profile:
        verts.append((r*math.cos(a),r*math.sin(a),9+i/steps+dz))
for i in range(turns*steps):
    for j in range(3):
        k=(j+1)%3
        faces.append((3*i+j,3*(i+1)+j,3*(i+1)+k,3*i+k))
faces.extend([(2,1,0), tuple(3*turns*steps+j for j in range(3))])
mesh = bpy.data.meshes.new('Rosca_Helicoidal')
mesh.from_pydata(verts, [], faces)
mesh.update()
obj = bpy.data.objects.new('Rosca_M18_Aproximada', mesh)
bpy.context.collection.objects.link(obj)
finish(obj, obj.name, metal)
cylinder('Faixa_Etiqueta', 8.48, 14, 53.8, label)
cylinder('Luz_Indicadora', 8.85, 2.8, 62.6, light, .25)
cylinder('Base_Conexao', 7, 1.6, 64.8, black)
ring('Conexao_Traseira_Metal', 6, 4.6, 65.6, 72, metal)
cylinder('Isolante_Conexao', 4.55, 1.2, 66.4, black)
for i in range(4):
    a = math.pi/4+i*math.pi/2
    pin=cylinder('Pino_Conexao_%d'%(i+1), .48, 3.4, 68.5, metal, .1)
    pin.location.x=2.5*math.cos(a)
    pin.location.y=2.5*math.sin(a)

# Convert geometry and positions to metres, avoiding a scaled root in GLB.
for obj in parts:
    obj.location *= .001
    for v in obj.data.vertices:
        v.co *= .001
root=bpy.data.objects.new('Sensor_Indutivo_M18', None)
bpy.context.collection.objects.link(root)
for obj in parts:
    obj.parent=root
root['diametro_nominal_mm']=18
root['comprimento_aproximado_mm']=72
root['observacao']='Referencia didatica; dimensoes longitudinais e conector aproximados; sem cabo e suporte.'
scene=bpy.context.scene
scene.unit_settings.system='METRIC'
scene.unit_settings.length_unit='MILLIMETERS'
bpy.ops.object.select_all(action='DESELECT')
for obj in parts+[root]:
    obj.select_set(True)
bpy.context.view_layer.objects.active=root
bpy.ops.export_scene.gltf(filepath=os.path.join(OUT,'sensor_indutivo_M18.glb'), export_format='GLB', use_selection=True, export_yup=True)

# Separate studio collection; only sensor objects were exported above.
studio=bpy.data.collections.new('Estudio_Preview')
scene.collection.children.link(studio)
def move_studio(obj):
    for c in list(obj.users_collection): c.objects.unlink(obj)
    studio.objects.link(obj)
def aim(obj, target):
    obj.rotation_euler=(Vector(target)-obj.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add(location=(.105,-.165,.092))
camera=bpy.context.object
camera.name='Camera_Preview'
aim(camera,(0,0,.036))
camera.data.type='ORTHO'
camera.data.ortho_scale=.092
camera.data.clip_start=.001
scene.camera=camera
move_studio(camera)
for name, loc, power, size in [('Principal',(.06,-.09,.12),5,.09),('Preenchimento',(-.07,-.04,.05),3,.08),('Recorte',(.02,.05,.08),6,.06)]:
    bpy.ops.object.light_add(type='AREA',location=loc)
    o=bpy.context.object
    o.name=name
    o.data.energy=power*.01
    o.data.shape='DISK'
    o.data.size=size
    aim(o,(0,0,.036))
    move_studio(o)
scene.world.color=(.18,.18,.18)
scene.render.engine='CYCLES'
scene.cycles.samples=32
scene.render.resolution_x=900
scene.render.resolution_y=1100
scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG'
scene.render.filepath=os.path.join(OUT,'sensor_indutivo_M18_preview.png')
scene.render.film_transparent=True
for screen in bpy.data.screens:
    for area in screen.areas:
        if area.type=='VIEW_3D':
            area.spaces.active.region_3d.view_distance=.14
            area.spaces.active.region_3d.view_location=(0,0,.036)
            area.spaces.active.clip_start=.001
bpy.context.preferences.filepaths.save_version=0
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT,'sensor_indutivo_M18.blend'))
bpy.ops.render.render(write_still=True)
print('SENSOR_OK',len(parts),'parts',sum(len(o.data.polygons) for o in parts),'polygons')
